import { ComboChildCommand } from "./ComboChildCommand";
import { LogicError } from "../../../errors/errors";
import { SimpleScrollingEmbed } from "../../../lib/views/embeds/SimpleScrollingEmbed";
import { displayNumberedList } from "../../../lib/views/displays";
import { Combo } from "../../../database/entity/Combo";
import { NicknameService } from "../../../services/Discord/NicknameService";
import { ArtistsService } from "../../../services/mirrorball/services/ArtistsService";
import { ServiceRegistry } from "../../../services/ServicesRegistry";
import { prefabArguments } from "../../../lib/context/arguments/prefabArguments";
import { bold } from "../../../helpers/discord";
import { ArgumentsMap } from "../../../lib/context/arguments/types";

const args = {
  ...prefabArguments.artist,
} satisfies ArgumentsMap;

export class ServerCombos extends ComboChildCommand<typeof args> {
  idSeed = "wonder girls hyelim";

  aliases = ["server", "scbs"];
  description = "Shows your server's largest combos";
  subcategory = "library stats";
  usage = [""];

  arguments = args;

  slashCommand = true;
  slashCommandName = "server";

  nicknameService = ServiceRegistry.get(NicknameService);
  artistsService = ServiceRegistry.get(ArtistsService);

  async run() {
    let artistName = this.parsedArguments.artist;

    if (artistName) {
      [artistName] = await this.artistsService.correctArtistNames(this.ctx, [
        artistName,
      ]);
    }

    const serverUsers = await this.serverUserIDs();

    await this.nicknameService.cacheNicknames(this.ctx, serverUsers);

    const combos = await this.comboService.listCombosForUsers(
      this.ctx,
      serverUsers,
      artistName
    );

    if (!combos.length) {
      throw new LogicError(
        `This server doesn't have any ${artistName ? `${artistName} ` : ""
        }combos saved yet! \`${this.prefix}combo\` saves your combo`
      );
    }

    const embed = this.newEmbed().setAuthor(
      this.generateEmbedAuthor(
        `${this.requiredGuild.name}'s top ${artistName ? `${artistName} ` : ""
        }combos`
      )
    );

    const displayCombo = ((combo: Combo) => {
      const nickname = this.nicknameService.cacheGetNickname(
        this.ctx,
        combo.user.discordID
      );

      return bold(nickname) + ": " + this.displayCombo(combo);
    }).bind(this);

    const scrollingEmbed = new SimpleScrollingEmbed(this.ctx, embed, {
      items: combos,
      pageSize: 5,
      pageRenderer(combos, { offset }) {
        return displayNumberedList(combos.map(displayCombo), offset);
      },
      overrides: { itemName: "combo" },
    });

    scrollingEmbed.send();
  }
}
