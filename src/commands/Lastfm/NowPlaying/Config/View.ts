import { code } from "../../../../helpers/discord";
import { NowPlayingConfigChildCommand } from "./NowPlayingConfigChildCommand";

export class View extends NowPlayingConfigChildCommand {
  idSeed = "weeekly jaehee";

  description = "View your current config";
  usage = [""];

  slashCommand = true;

  async run() {
    const { senderUser } = await this.getMentions({
      senderRequired: true,
    });

    const config = await this.configService.getConfigNoUnused(
      this.ctx,
      senderUser!
    );

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Config view"))
      .setFooter({
        text: `This config only applies to your ${this.prefix}fmx calls\nSee ${this.prefix}npc help for more info`,
      });

    if (config.length) {
      embed.setDescription(config.map((c) => code(c)).join(", "));
    } else {
      embed.setDescription("Empty config (your footer will be blank)");
    }

    await this.send(embed);
  }
}
