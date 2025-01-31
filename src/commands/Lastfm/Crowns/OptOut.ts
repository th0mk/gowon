import { bold } from "../../../helpers/discord";
import { displayNumber } from "../../../lib/views/displays";
import { ConfirmationEmbed } from "../../../lib/views/embeds/ConfirmationEmbed";
import { CrownsChildCommand } from "./CrownsChildCommand";

export class OptOut extends CrownsChildCommand {
  idSeed = "wjsn seola";

  description =
    "Opts you out of the crowns game, deleting all your crowns, and preventing you from getting new ones";
  usage = "";

  slashCommand = true;

  async run() {
    const { dbUser } = await this.getMentions({ dbUserRequired: true });

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Crown opt-out"))
      .setDescription(
        `Are you sure you want to opt out? This will delete all your crowns!`
      );

    const confirmationEmbed = new ConfirmationEmbed(this.ctx, embed);

    if (await confirmationEmbed.awaitConfirmation(this.ctx)) {
      await this.crownsService.scribe.optOut(
        this.ctx,
        dbUser,
        this.ctx.payload.member!
      );

      const numberOfCrowns = await this.crownsService.optOut(
        this.ctx,
        this.author.id
      );

      await confirmationEmbed.sentMessage?.edit({
        embeds: [
          embed.setDescription(
            `Opted you out, deleting ${bold(
              displayNumber(numberOfCrowns, "crown")
            )}!`
          ),
        ],
      });
    }
  }
}
