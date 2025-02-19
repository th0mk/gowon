import { Command } from "../../lib/command/Command";

export default class SecretCommands extends Command {
  idSeed = "2ne1 minzy";

  description = "Shows the secret commands";
  subcategory = "developer";
  secretCommand = true;
  devCommand = true;

  async run() {
    const commands = this.commandRegistry
      .list(true)
      .filter((c) => c.secretCommand);

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Secret commands"))
      .setDescription(commands.map((c) => c.name).join(", "));

    await this.send(embed);
  }
}
