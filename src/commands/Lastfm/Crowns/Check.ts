import { prefabArguments } from "../../../lib/context/arguments/prefabArguments";
import { ArgumentsMap } from "../../../lib/context/arguments/types";
import { CrownsChildCommand } from "./CrownsChildCommand";

const args = {
  ...prefabArguments.artist,
} satisfies ArgumentsMap;

export class Check extends CrownsChildCommand<typeof args> {
  idSeed = "weki meki sei";

  aliases = ["c", "w"];
  description = "Checks a crown. If you have more plays, you will take it.";
  usage = ["", "artist"];

  slashCommand = true;

  arguments = args;

  async run() {
    const { senderUser, senderRequestable } = await this.getMentions({
      dbUserRequired: true,
      senderRequired: true,
    });

    await this.ensureUserCanCheck(senderUser!);

    const artist = await this.lastFMArguments.getArtist(
      this.ctx,
      senderRequestable
    );

    const artistInfo = await this.lastFMService.artistInfo(this.ctx, {
      artist,
      username: senderRequestable,
    });

    const crownCheck = await this.crownsService.check(this.ctx, {
      artistName: artistInfo.name,
      plays: artistInfo.userPlaycount,
      senderDBUser: senderUser!,
    });

    const baseEmbed = this.newEmbed().setAuthor(
      this.generateEmbedAuthor("Crowns check")
    );

    const embed = crownCheck.asEmbed(this.ctx, baseEmbed);

    await this.send(embed);

    if (crownCheck.shouldRecordHistory()) {
      this.crownsService.scribe.handleCheck(this.ctx, crownCheck);
    }
  }
}
