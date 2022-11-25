import { bold } from "../../../helpers/discord";
import { prefabArguments } from "../../../lib/context/arguments/prefabArguments";
import { ArgumentsMap } from "../../../lib/context/arguments/types";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { CrownsChildCommand } from "./CrownsChildCommand";

const args = {
  ...prefabArguments.requiredArtist,
} satisfies ArgumentsMap;

export class UnbanArtist extends CrownsChildCommand<typeof args> {
  idSeed = "elris sohee";

  description = "Unbans an artist from the crowns game";
  usage = "artist";
  arguments = args;

  adminCommand = true;

  validation: Validation = {
    artist: new validators.RequiredValidator({}),
  };

  async run() {
    let artist = this.parsedArguments.artist;

    let artistCrownBan = await this.crownsService.artistCrownUnban(
      this.ctx,
      artist
    );

    await this.crownsService.killCrown(this.ctx, artistCrownBan.artistName);

    await this.oldReply(
      `succesfully unbanned ${bold(
        artistCrownBan.artistName
      )} from the crowns game.`
    );
  }
}
