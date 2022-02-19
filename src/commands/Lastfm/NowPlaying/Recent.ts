import { LinkGenerator } from "../../../helpers/lastFM";
import { NumberArgument } from "../../../lib/context/arguments/argumentTypes/NumberArgument";
import { standardMentions } from "../../../lib/context/arguments/mentionTypes/mentions";
import { requestableAsUsername } from "../../../lib/MultiRequester";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { displayLink, displayNumberedList } from "../../../lib/views/displays";
import { RecentTrack } from "../../../services/LastFM/converters/RecentTracks";
import { LastFMBaseCommand } from "../LastFMBaseCommand";

const args = {
  ...standardMentions,
  amount: new NumberArgument({ default: 5 }),
} as const;

export default class Recent extends LastFMBaseCommand<typeof args> {
  idSeed = "fx krystal";

  description = "Shows a few of your recent tracks";
  subcategory = "nowplaying";
  usage = ["", "amount"];

  arguments = args;

  validation: Validation = {
    amount: new validators.Range({ min: 1, max: 15 }),
  };

  async run() {
    const amount = this.parsedArguments.amount;

    const { requestable, perspective } = await this.parseMentions();

    const recentTracks = await this.lastFMService.recentTracks(this.ctx, {
      username: requestable,
      limit: amount,
    });

    const embed = this.newEmbed()
      .setAuthor({
        ...this.generateEmbedAuthor(
          `${perspective.upper.possessive.replace(/`/g, "")} recent tracks`
        ),
        url: LinkGenerator.userPage(requestableAsUsername(requestable)),
      })
      .setDescription(
        (recentTracks.isNowPlaying
          ? `\`${amount! > 9 ? " " : ""}•\`. ` +
            this.displayTrack(recentTracks.nowPlaying!) +
            "\n"
          : "") +
          displayNumberedList(
            recentTracks.withoutNowPlaying.map(this.displayTrack)
          )
      )
      .setThumbnail(recentTracks.first().images.get("large") || "");

    await this.send(embed);
  }

  private displayTrack(t: RecentTrack) {
    return `${displayLink(t.name, t.url)} by ${t.artist.strong()} ${
      t.album ? `\nfrom ${t.album.italic()}\n` : "\n"
    }`;
  }
}
