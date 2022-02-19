import { TasteCalculator } from "../../../lib/calculators/TasteCalculator";
import { sanitizeForDiscord } from "../../../helpers/discord";
import { Variation } from "../../../lib/command/BaseCommand";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { LogicError } from "../../../errors";
import { TagsService } from "../../../services/mirrorball/services/TagsService";
import { TasteCommand, tasteArgs } from "./TasteCommand";
import { SimpleScrollingEmbed } from "../../../lib/views/embeds/SimpleScrollingEmbed";
import { displayNumber } from "../../../lib/views/displays";
import { ServiceRegistry } from "../../../services/ServicesRegistry";
import { StringArgument } from "../../../lib/context/arguments/argumentTypes/StringArgument";
import { NumberArgument } from "../../../lib/context/arguments/argumentTypes/NumberArgument";

const args = {
  ...tasteArgs,
  tag: new StringArgument({ index: 0, splitOn: "|" }),
  artistAmount: new NumberArgument({ default: 1000 }),
  username: new StringArgument({
    regex: /(?<=.\|.*)[\w\-\!]+/gi,
    index: 0,
  }),
  username2: new StringArgument({
    regex: /(?<=.\|.*)[\w\-\!]+/gi,
    index: 1,
  }),
} as const;

export default class TagTaste extends TasteCommand<typeof args> {
  idSeed = "iz*one yuri";
  aliases = ["tat", "ttaste", "ttb"];
  description = "Shows your taste overlap within a genre with another user";
  usage = [
    "",
    "@user or lfm:username",
    "time period @user",
    "username amount time period",
  ];

  variations: Variation[] = [
    {
      name: "embed",
      variation: "tte",
      description:
        "Uses an embed view instead of a table to display (more mobile friendly)",
    },
  ];

  arguments = args;

  validation: Validation = {
    tag: new validators.Required({}),
    artistAmount: {
      validator: new validators.Range({ min: 100, max: 2000 }),
      friendlyName: "artist amount",
    },
  };

  tagService = ServiceRegistry.get(TagsService);

  async run() {
    const artistAmount = this.parsedArguments.artistAmount!,
      tag = this.parsedArguments.tag!;

    const [userOneUsername, userTwoUsername] = await this.getUsernames();

    const [senderPaginator, mentionedPaginator] = this.getPaginators(
      userOneUsername,
      userTwoUsername
    );

    const [senderArtists, mentionedArtists] = await Promise.all([
      senderPaginator.getAllToConcatonable(),
      mentionedPaginator.getAllToConcatonable(),
    ]);

    const senderArtistsFiltered = await this.tagService.filterArtists(
      this.ctx,
      senderArtists.artists,
      [tag]
    );
    const mentionedArtistsFiltered = await this.tagService.filterArtists(
      this.ctx,
      mentionedArtists.artists,
      [tag]
    );

    const tasteCalculator = new TasteCalculator(
      senderArtistsFiltered,
      mentionedArtistsFiltered,
      artistAmount
    );

    const taste = tasteCalculator.calculate();

    if (taste.artists.length === 0)
      throw new LogicError(
        `${userOneUsername} and ${userTwoUsername} share no common ${tag} artists!`
      );

    const embedDescription = `Comparing top ${displayNumber(
      senderArtists.artists.slice(0, artistAmount).length,
      "artist"
    )}, ${displayNumber(taste.artists.length, `overlapping ${tag} artist`)} (${
      taste.percent
    }% match) found.`;

    const embed = this.newEmbed()
      .setTitle(
        `${tag} taste comparison for ${sanitizeForDiscord(
          userOneUsername
        )} and ${sanitizeForDiscord(userTwoUsername)}`
      )
      .setDescription(embedDescription);

    if (this.variationWasUsed("embed")) {
      this.generateEmbed(taste, embed);
      await this.send(embed);
    } else {
      const scrollingEmbed = new SimpleScrollingEmbed(this.message, embed, {
        items: taste.artists,
        pageSize: 20,
        pageRenderer: (items) => {
          return (
            embedDescription +
            "\n" +
            this.generateTable(userOneUsername, userTwoUsername, items)
          );
        },
      });

      scrollingEmbed.send();
    }
  }
}
