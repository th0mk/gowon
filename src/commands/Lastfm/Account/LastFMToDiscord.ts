import { LastFMBaseCommand } from "../LastFMBaseCommand";
import { LogicError } from "../../../errors/errors";
import { StringArgument } from "../../../lib/context/arguments/argumentTypes/StringArgument";
import { bold, code } from "../../../helpers/discord";
import { ArgumentsMap } from "../../../lib/context/arguments/types";

const args = {
  username: new StringArgument({
    index: 0,
    description: "The username of the user to lookup",
    required: true,
  }),
} satisfies ArgumentsMap;

export default class LastFmToDiscord extends LastFMBaseCommand<typeof args> {
  idSeed = "loona choerry";

  aliases = ["lfm2d", "last2todiscord", "l2d"];
  description = "Shows who is logged in as a given Last.fm user";
  subcategory = "accounts";
  usage = "lastfm_username";

  arguments = args;
  slashCommand = true;

  async run() {
    let username = this.parsedArguments.username;

    let user = await this.usersService.getUserFromLastFMUsername(
      this.ctx,
      username
    );

    let member = user
      ? await this.requiredGuild.members.fetch(user.discordID)
      : undefined;

    if (!user || !member)
      throw new LogicError(
        `couldn't find anyone logged in as ${code(username)} in this server.`
      );

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Account lookup"))
      .setDescription(
        `${bold(member.nickname || member.user.username)} (${member.user.username
        }#${member.user.discriminator}) is logged in as ${code(
          username.toLowerCase()
        )}.`
      );

    await this.send(embed);
  }
}
