import { TasteCalculator } from "../../../lib/calculators/TasteCalculator";
import { Variation } from "../../../lib/command/BaseCommand";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { LogicError } from "../../../errors";
import { TasteCommand, tasteArgs } from "./TasteCommand";
import { SimpleScrollingEmbed } from "../../../lib/views/embeds/SimpleScrollingEmbed";
import { displayLink, displayNumber } from "../../../lib/views/displays";
import { humanizePeriod } from "../../../lib/timeAndDate/helpers";
import { LinkGenerator } from "../../../helpers/lastFM";
import { NumberArgument } from "../../../lib/context/arguments/argumentTypes/NumberArgument";
import { TimePeriodArgument } from "../../../lib/context/arguments/argumentTypes/timeAndDate/TimePeriodArgument";
import { TimeRangeArgument } from "../../../lib/context/arguments/argumentTypes/timeAndDate/TimeRangeArgument";
import { StringArgument } from "../../../lib/context/arguments/argumentTypes/StringArgument";

const args = {
  ...tasteArgs,
  artistAmount: new NumberArgument({ default: 1000 }),
  timePeriod: new TimePeriodArgument(),
  timeRange: new TimeRangeArgument(),
  username: new StringArgument({ index: 0 }),
  username2: new StringArgument({ index: 1 }),
} as const;

export default class Taste extends TasteCommand<typeof args> {
  idSeed = "secret number jinny";
  aliases = ["t", "tb"];
  description = "Shows your taste overlap with another user";
  usage = [
    "",
    "@user or lfm:username",
    "time period @user",
    "username amount time period",
  ];

  variations: Variation[] = [
    {
      name: "embed",
      variation: "te",
      description:
        "Uses an embed view instead of a table to display (more mobile friendly)",
    },
  ];

  arguments = args;

  validation: Validation = {
    artistAmount: {
      validator: new validators.Range({ min: 100, max: 2000 }),
      friendlyName: "amount",
    },
  };

  async run() {
    const artistAmount = this.parsedArguments.artistAmount!;
    const humanizedPeriod = humanizePeriod(this.parsedArguments.timePeriod!);

    const [userOneUsername, userTwoUsername] = await this.getUsernames();

    const [senderPaginator, mentionedPaginator] = this.getPaginators(
      userOneUsername,
      userTwoUsername
    );

    const [senderArtists, mentionedArtists] = await Promise.all([
      senderPaginator.getAllToConcatonable(),
      mentionedPaginator.getAllToConcatonable(),
    ]);

    const tasteCalculator = new TasteCalculator(
      senderArtists.artists,
      mentionedArtists.artists,
      artistAmount
    );

    const taste = tasteCalculator.calculate();

    if (taste.artists.length === 0) {
      throw new LogicError(
        `${userOneUsername.code()} and ${userTwoUsername.code()} share no common artists!`
      );
    }

    const percentageMatch =
      userOneUsername === userTwoUsername
        ? "It's 100%, what are you expecting :neutral_face:"
        : `Comparing top ${displayNumber(
            senderArtists.artists.slice(0, artistAmount).length,
            "artist"
          )}, ${displayNumber(taste.artists.length, "overlapping artist")} (${
            taste.percent
          }% match) found.`;

    const embedDescription = `**Comparison for ${displayLink(
      userOneUsername,
      LinkGenerator.userPage(userOneUsername)
    )} and ${displayLink(
      userTwoUsername,
      LinkGenerator.userPage(userTwoUsername)
    )} ${this.timeRange?.humanized || humanizedPeriod}**\n\n${percentageMatch}`;

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Taste"))
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
