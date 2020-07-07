import { CommandManager } from "./CommandManager";
import { Message } from "discord.js";
import { BotMomentService } from "../../services/BotMomentService";
import { AdminService } from "../../services/dbservices/AdminService";
import { Logger } from "../Logger";
import { CheckFailReason } from "../permissions/Can";

export class CommandHandler {
  botMomentService = BotMomentService.getInstance();
  adminService = new AdminService();
  commandManager = new CommandManager();
  private logger = new Logger();

  constructor() {}

  async init() {
    await this.commandManager.init();
  }

  async handle(message: Message): Promise<void> {
    if (
      message.content.toLowerCase().includes("stupid bot") ||
      message.content.toLowerCase().includes("fuck you bot")
    ) {
      await message.react("😔");
    }

    if (message.content.startsWith(this.botMomentService.prefix)) {
      let { command, runAs } = this.commandManager.find(message.content);

      let canCheck = await this.adminService.can.run(command, message);

      if (!canCheck.passed) {
        Logger.log(
          "CommandHandler",
          canCheck.reason === CheckFailReason.disabled
            ? `Attempt to run disabled command ${command.name}`
            : `User ${message.author.username} did not have permissions to run command ${command.name} (${command.id})`
        );

        return;
      }
      this.logger.logCommandHandle(runAs);

      await command.execute(message, runAs);
    }
  }
}
