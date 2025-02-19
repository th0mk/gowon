import { Stopwatch } from "../../../helpers";
import { CommandRedirect } from "../../../lib/command/Command";
import Index from "./Index";
import { Flag } from "../../../lib/context/arguments/argumentTypes/Flag";
import { displayProgressBar } from "../../../lib/views/displays";
import { LilacBaseCommand } from "../../../lib/Lilac/LilacBaseCommand";
import { ArgumentsMap } from "../../../lib/context/arguments/types";

const args = {
  full: new Flag({
    shortnames: [],
    longnames: ["full", "force"],
    description: "Do a full index (download all your data)",
  }),
} satisfies ArgumentsMap;

export default class Update extends LilacBaseCommand<typeof args> {
  idSeed = "bvndit yiyeon";
  aliases = ["u", "🆙date"];
  subcategory = "library";
  description = "Updates a user's cached data based on their lastest scrobbles";

  slashCommand = true;
  arguments = args;

  redirects: CommandRedirect<typeof args>[] = [
    { when: (args) => args.full, redirectTo: Index },
  ];

  async run() {
    this.mirrorballUsersService.quietAddUserToGuild(
      this.ctx,
      this.author.id,
      this.requiredGuild.id
    );

    await this.lilacUsersService.update(this.ctx, {
      discordID: this.author.id,
    });

    const observable = this.lilacUsersService.indexingProgress(this.ctx, {
      discordID: this.author.id,
    });

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Lilac updating"))
      .setDescription("Updating...");

    const sentMessage = await this.send(embed);

    const stopwatch = new Stopwatch().start();

    const subscription = observable.subscribe(async (progress) => {
      if (progress.page === progress.totalPages) {
        await this.discordService.edit(
          this.ctx,
          sentMessage,
          embed.setDescription("Done!")
        );
        subscription.unsubscribe();
      } else if (stopwatch.elapsedInMilliseconds >= 3000) {
        await this.discordService.edit(
          this.ctx,
          sentMessage,
          embed.setDescription(
            `Updating...
${displayProgressBar(progress.page, progress.totalPages, {
              width: this.progressBarWidth,
            })}
*Page ${progress.page}/${progress.totalPages}*`
          )
        );

        stopwatch.zero().start();
      }
    });
  }
}
