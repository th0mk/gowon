import { LogicError, UnknownMirrorballError } from "../../../../errors/errors";
import { prefabArguments } from "../../../../lib/context/arguments/prefabArguments";
import { ArgumentsMap } from "../../../../lib/context/arguments/types";
import { displayRating } from "../../../../lib/views/displays";
import { AlbumCoverService } from "../../../../services/moderation/AlbumCoverService";
import { ServiceRegistry } from "../../../../services/ServicesRegistry";
import { RatingConnector, RatingParams, RatingResponse } from "./connectors";
import { RateYourMusicIndexingChildCommand } from "./RateYourMusicChildCommand";

const args = {
  ...prefabArguments.album,
} satisfies ArgumentsMap;

export class Rating extends RateYourMusicIndexingChildCommand<
  RatingResponse,
  RatingParams,
  typeof args
> {
  connector = new RatingConnector();

  idSeed = "sonamoo newsun";
  description = "Shows what you've rated an album";

  arguments = args;

  slashCommand = true;

  albumCoverService = ServiceRegistry.get(AlbumCoverService);

  async run() {
    const { senderRequestable, dbUser } = await this.getMentions({
      senderRequired:
        !this.parsedArguments.artist || !this.parsedArguments.album,
      reverseLookup: { required: true },
      indexedRequired: true,
    });

    const { artist, album } = await this.lastFMArguments.getAlbum(
      this.ctx,
      senderRequestable
    );

    const response = await this.query({
      user: {
        lastFMUsername: dbUser.lastFMUsername,
        discordID: dbUser.discordID,
      },
      album: { name: album, artist: { name: artist } },
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new UnknownMirrorballError();
    }

    if (!response.ratings.ratings.length) {
      throw new LogicError("Couldn't find this album in your ratings!");
    }

    const { rating, rateYourMusicAlbum } = response.ratings.ratings[0];

    const albumInfo = await this.lastFMService.albumInfo(this.ctx, {
      artist,
      album,
    });

    const albumCover = await this.albumCoverService.get(
      this.ctx,
      albumInfo.images.get("large"),
      {
        metadata: { artist, album },
      }
    );

    const embed = this.newEmbed()
      .setAuthor(this.generateEmbedAuthor("Rating"))
      .setTitle(
        `${rateYourMusicAlbum.artistName} - ${rateYourMusicAlbum.title}`
      )
      .setDescription(`${displayRating(rating)}`)
      .setThumbnail(albumCover || "");

    await this.send(embed);
  }
}
