import { Arguments } from "../../../lib/arguments/arguments";
import { TasteCalculator } from "../../../lib/calculators/TasteCalculator";
import { Variation } from "../../../lib/command/BaseCommand";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { LogicError } from "../../../errors";
import { TasteCommand, tasteMentions } from "./TasteCommand";
import { SimpleScrollingEmbed } from "../../../lib/views/embeds/SimpleScrollingEmbed";
import { displayLink, displayNumber } from "../../../lib/views/displays";
import { TimePeriodParser } from "../../../lib/arguments/custom/TimePeriodParser";
import { humanizePeriod } from "../../../lib/timeAndDate/helpers";
import { TimeRangeParser } from "../../../lib/arguments/custom/TimeRangeParser";
import { LinkGenerator } from "../../../helpers/lastFM";

const args = {
  inputs: {
    artistAmount: {
      index: 0,
      regex: /\b(([13-9]\d*)|(2\d{1,2})|(2\d{4,})|(2000))\b/g,
      default: 1000,
      number: true,
    },
    timePeriod: { custom: new TimePeriodParser() },
    timeRange: { custom: new TimeRangeParser() },
    username: {
      regex: /[\w\-\!]+/gi,
      index: 0,
    },
    username2: {
      regex: /[\w\-\!]+/gi,
      index: 1,
    },
  },
  mentions: tasteMentions,
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

  arguments: Arguments = args;

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
