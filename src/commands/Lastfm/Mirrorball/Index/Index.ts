import {
  MirrorballError,
  LogicError,
  IndexingDisabledBecauseOfIssueModeError,
} from "../../../../errors";
import { ConfirmationEmbed } from "../../../../lib/views/embeds/ConfirmationEmbed";
import {
  ConcurrencyService,
  ConcurrentAction,
} from "../../../../services/ConcurrencyService";
import { MirrorballBaseCommand as MirrorballBaseCommand } from "../../../../lib/indexing/MirrorballCommands";
import { Validation } from "../../../../lib/validation/ValidationChecker";
import { validators } from "../../../../lib/validation/validators";
import {
  IndexUserParams,
  IndexUserResponse,
  IndexUserConnector,
} from "./Index.connector";
import { ServiceRegistry } from "../../../../services/ServicesRegistry";

export default class Index extends MirrorballBaseCommand<
  IndexUserResponse,
  IndexUserParams
> {
  connector = new IndexUserConnector();

  subcategory = "library";
  aliases = ["fullindex"];

  idSeed = "iz*one yujin";

  description =
    "Fully index a user, deleting any previous data and replacing it";

  validation: Validation = {
    username: new validators.Required({}),
  };

  concurrencyService = ServiceRegistry.get(ConcurrencyService);

  async prerun() {
    if (
      await this.concurrencyService.isUserDoingAction(
        this.author.id,
        ConcurrentAction.Indexing,
        ConcurrentAction.Updating
      )
    ) {
      throw new LogicError(
        "You are already being updated or indexed, please wait until you are done!"
      );
    }

    if (this.gowonClient.isInIssueMode)
      throw new IndexingDisabledBecauseOfIssueModeError();
  }

  async run() {
    const { senderUsername } = await this.parseMentions({
      authentificationRequired: true,
    });

    this.mirrorballService.quietAddUserToGuild(
      this.ctx,
      this.author.id,
      this.guild.id
    );

    const indexingUsername = senderUsername;

    const perspective = this.usersService.perspective(
      senderUsername,
      indexingUsername
    );

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Indexing"))
      .setDescription(
        "Indexing will delete all your data, and re-download it. Are you sure you want to full index?"
      )
      .setFooter({ text: this.indexingHelp });

    const confirmationEmbed = new ConfirmationEmbed(
      this.message,
      embed,
      this.gowonClient
    );

    if (!(await confirmationEmbed.awaitConfirmation())) {
      return;
    } else {
      confirmationEmbed.sentMessage?.edit({
        embeds: [embed.setDescription(this.indexingInProgressHelp)],
      });
    }

    let response = await this.query({
      user: { lastFMUsername: indexingUsername, discordID: this.author.id },
      guildID: this.guild.id,
      discordID: this.author.id,
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new MirrorballError("An unknown error occurred");
    }

    this.concurrencyService.registerUser(
      this.ctx,
      ConcurrentAction.Indexing,
      this.author.id
    );

    this.mirrorballService.webhook.onResponse(response.fullIndex.token, () => {
      this.concurrencyService.unregisterUser(
        this.ctx,
        ConcurrentAction.Indexing,
        this.author.id
      );
      this.usersService.setAsIndexed(this.ctx, this.author.id);
      this.notifyUser(perspective, "index");
    });
  }
}
