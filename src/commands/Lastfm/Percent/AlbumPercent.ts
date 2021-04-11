import { Arguments } from "../../../lib/arguments/arguments";
import { numberDisplay } from "../../../helpers";
import { calculatePercent } from "../../../helpers/stats";
import { LastFMBaseCommand } from "../LastFMBaseCommand";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";

const args = {
  inputs: {
    artist: { index: 0, splitOn: "|" },
    album: { index: 1, splitOn: "|" },
  },
  mentions: standardMentions,
} as const;

export default class AlbumPercent extends LastFMBaseCommand<typeof args> {
  idSeed = "twice chaeyoung";

  aliases = ["lpct", "alpct"];
  description =
    "Shows you what percentage of an artist's scrobbles are made up by a certain album";
  subcategory = "percents";
  usage = ["", "artist | album"];

  arguments: Arguments = args;

  async run() {
    let artist = this.parsedArguments.artist,
      album = this.parsedArguments.album;

    let { username, senderUsername, perspective } = await this.parseMentions({
      senderRequired: !artist || !album,
    });

    if (!artist || !album) {
      let nowPlaying = await this.lastFMService.nowPlayingParsed(
        senderUsername
      );

      if (!artist) artist = nowPlaying.artist;
      if (!album) album = nowPlaying.album;
    }

    let [artistInfo, albumInfo] = await Promise.all([
      this.lastFMService.artistInfo({ artist, username }),
      this.lastFMService.albumInfo({ artist, album, username }),
    ]);

    await this.traditionalReply(
      `${perspective.possessive} ${numberDisplay(
        albumInfo.userplaycount,
        "play"
      )} of ${albumInfo.name.strong()} represent ${calculatePercent(
        albumInfo.userplaycount,
        artistInfo.stats.userplaycount
      ).strong()}% of ${
        perspective.possessivePronoun
      } ${artistInfo.name.strong()} scrobbles`
    );
  }
}
