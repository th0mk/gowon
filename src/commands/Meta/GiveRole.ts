import { LogicError } from "../../errors";
import { CommandAccessRoleName, roles } from "../../lib/command/access/roles";
import { BaseCommand, Variation } from "../../lib/command/BaseCommand";
import { DiscordUserArgument } from "../../lib/context/arguments/argumentTypes/discord/DiscordUserArgument";
import { StringArgument } from "../../lib/context/arguments/argumentTypes/StringArgument";
import { UserStringArgument } from "../../lib/context/arguments/argumentTypes/UserStringArgument";
import { DiscordIDMention } from "../../lib/context/arguments/mentionTypes/DiscordIDMention";
import { validators } from "../../lib/validation/validators";

const args = {
  role: new StringArgument({ index: 0 }),
  userID: new UserStringArgument({ mention: new DiscordIDMention() }),
  user: new DiscordUserArgument(),
} as const;

export default class GiveRole extends BaseCommand<typeof args> {
  idSeed = "dreamnote hanbyeol";

  subcategory = "developer";
  aliases = ["addrole"];
  description = "Gives a user a role";
  secretCommand = true;
  devCommand = true;

  variations: Variation[] = [
    {
      name: "remove",
      variation: ["removerole", "delrole"],
    },
  ];

  arguments = args;

  validation = {
    role: [
      new validators.Required({}),
      new validators.Choices({
        choices: Object.keys(roles),
        ignoreCase: false,
      }),
    ],
  };

  async run() {
    const role = this.parsedArguments.role!;
    const { mentionedDBUser } = await this.parseMentions();

    if (!mentionedDBUser) {
      throw new LogicError(
        "The user you mentioned does not exist in the database!"
      );
    }

    const newRoles = this.variationWasUsed("remove")
      ? mentionedDBUser.roles?.filter((r) => r !== role)
      : [...new Set(mentionedDBUser.roles || []), role];

    await this.usersService.setRoles(
      this.ctx,
      mentionedDBUser.discordID,
      (newRoles as CommandAccessRoleName[]) || []
    );

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Role management"))
      .setDescription(
        `Succesfully ${
          this.variationWasUsed("remove") ? "removed" : "added"
        } the role ${role.code()}`
      );

    await this.send(embed);
  }
}
