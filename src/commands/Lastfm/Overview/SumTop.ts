import { OverviewChildCommand } from "./OverviewChildCommand";
import { Message, MessageEmbed } from "discord.js";
import { Arguments } from "../../../lib/arguments/arguments";
import { LogicError } from "../../../errors";
import { numberDisplay, ucFirst } from "../../../helpers";

export class SumTop extends OverviewChildCommand {
  aliases = [];
  description = "Shows how much of your scrobbles your top artists make up";
  usage = ["", "top", "top @user"];

  arguments: Arguments = {
    mentions: this.arguments.mentions,
    inputs: {
      top: { index: 0, regex: /[0-9]{1,4}/, default: 10, number: true },
    },
  };

  async run(message: Message) {
    let top = this.parsedArguments.top as number;
    let { username, perspective } = await this.parseMentionedUsername(message);

    if (top > 1000 || top < 2)
      throw new LogicError("Please enter a valid number (between 2 and 1000)");

    let { badge, colour, image } = await this.getAuthorDetails();
    let [sumtop, sumtoppct] = await Promise.all([
      this.calculator.sumTop(10),
      this.calculator.sumTopPercent(10),
    ]);

    let embed = new MessageEmbed()
      .setAuthor(username + badge, image)
      .setColor(colour)
      .setDescription(
        `${ucFirst(perspective.possessive)} top ${numberDisplay(
          top,
          "artist"
        ).bold()} make up ${numberDisplay(
          sumtop,
          "scrobble"
        ).bold()} (${sumtoppct.bold()}% of ${
          perspective.possesivePronoun
        } total scrobbles!)`
      );

    await message.channel.send(embed);
  }
}
