import { LogicError, UnknownIndexerError } from "../../../../errors";
import { Arguments } from "../../../../lib/arguments/arguments";
import { RatingConnector, RatingParams, RatingResponse } from "./connectors";
import { RateYourMusicIndexingChildCommand } from "./RateYourMusicChildCommand";
import { ratingDisplay } from "../../../../helpers";

const args = {
  inputs: {
    artist: { index: 0, splitOn: "|" },
    album: { index: 1, splitOn: "|" },
  },
} as const;

export class Rating extends RateYourMusicIndexingChildCommand<
  RatingResponse,
  RatingParams,
  typeof args
> {
  connector = new RatingConnector();

  idSeed = "sonamoo newsun";
  description = "Shows what you've rated an album";
  secretCommand = true;

  rollout = {
    guilds: this.indexerGuilds,
  };

  arguments: Arguments = args;

  async run() {
    let artist = this.parsedArguments.artist!,
      album = this.parsedArguments.album!;

    let { senderUsername, dbUser, senderUser } = await this.parseMentions({
      senderRequired: !artist || !album,
    });

    const user = (dbUser || senderUser)!;

    if (!artist || !album) {
      let nowPlaying = await this.lastFMService.nowPlayingParsed(
        senderUsername
      );

      if (!artist) artist = nowPlaying.artist;
      if (!album) album = nowPlaying.album;
    }

    const response = await this.query({
      user: { lastFMUsername: user.lastFMUsername, discordID: user.discordID },
      album: { name: album, artist: { name: artist } },
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new UnknownIndexerError();
    }

    if (!response.ratings.length) {
      throw new LogicError("Couldn't find this album in your ratings!");
    }

    const { rating, rateYourMusicAlbum } = response.ratings[0];

    const albumInfo = await this.lastFMService.albumInfo({ artist, album });

    const embed = this.newEmbed()
      .setAuthor(...this.generateEmbedAuthor("Rating"))
      .setTitle(
        `${rateYourMusicAlbum.artistName} - ${rateYourMusicAlbum.title}`
      )
      .setDescription(`${ratingDisplay(rating)}`)
      .setThumbnail(
        albumInfo.image.find((i) => i.size === "large")?.["#text"]!
      );

    await this.send(embed);
  }
}
