import { FishyNotFoundError } from "../../errors/fishy";
import { bold, italic } from "../../helpers/discord";
import { emDash, quote } from "../../helpers/specialCharacters";
import { StringArgument } from "../../lib/context/arguments/argumentTypes/StringArgument";
import { ArgumentsMap } from "../../lib/context/arguments/types";
import { ServiceRegistry } from "../../services/ServicesRegistry";
import { FishyService } from "../../services/fishy/FishyService";
import { findFishy } from "../../services/fishy/fishyList";
import { FishyChildCommand } from "./FishyChildCommand";

const args = {
  fishy: new StringArgument({
    index: { start: 0 },
    description: "The fishy name to learn about",
    required: true,
  }),
} satisfies ArgumentsMap;

export class Wiki extends FishyChildCommand<typeof args> {
  idSeed = "le sserafim eunchae";
  aliases = ["info", "fishypedia"];

  description = "See information about a fish";

  arguments = args;

  fishyService = ServiceRegistry.get(FishyService);

  async run() {
    const fishyName = this.parsedArguments.fishy;

    const fishy = findFishy(fishyName);

    if (!fishy) throw new FishyNotFoundError(fishyName);

    let embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Fishy wiki"))
      .setColor(fishy.rarity.colour)
      .setTitle(fishy.name)
      .setDescription(
        `
${fishy.emoji} ${bold(italic(fishy.binomialName), false)} ${emDash} ${
          fishy.rarity.isTrash()
            ? fishy.rarity.name
            : `${fishy.rarity.name} fishy`
        } 

${italic(quote(fishy.description))}`
      );

    if (!fishy.rarity.isTrash()) {
      embed = embed.addField(
        "Weight",
        `${fishy.minWeight}kg - ${fishy.maxWeight}kg`
      );
    }

    await this.send(embed);
  }
}
