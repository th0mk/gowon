import { OverviewChildCommand } from "./OverviewChildCommand";
import { Arguments } from "../../../lib/arguments/arguments";
import { LogicError } from "../../../errors";
import { numberDisplay } from "../../../helpers";

export class SumTop extends OverviewChildCommand {
  aliases = ["toppct"];
  description = "Shows what percent of your scrobbles are made up by your top artists";
  usage = ["", "top", "top @user"];

  arguments: Arguments = {
    mentions: this.arguments.mentions,
    inputs: {
      top: { index: 0, regex: /[0-9]{1,4}/, default: 10, number: true },
    },
  };

  async run() {
    let top = this.parsedArguments.top as number;
    let { username, perspective } = await this.parseMentions();

    if (top > 1000 || top < 2)
      throw new LogicError("Please enter a valid number (between 2 and 1000)");

    // Cache the top artists and user info responses
    await Promise.all([this.calculator.topArtists(), this.calculator.userInfo()])

    let { badge, colour, image } = await this.getAuthorDetails();
    let [sumtop, sumtoppct] = await Promise.all([
      this.calculator.sumTop(top),
      this.calculator.sumTopPercent(10),
    ]);

    let embed = this.newEmbed()
      .setAuthor(username + badge, image)
      .setColor(colour)
      .setDescription(
        `${perspective.upper.possessive} top ${numberDisplay(
          top,
          "artist"
        ).bold()} make up ${numberDisplay(
          sumtop.asNumber,
          "scrobble"
        ).bold()} (${sumtoppct.asString.bold()}% of ${
          perspective.possessivePronoun
        } total scrobbles!)`
      );

    await this.send(embed);
  }
}
