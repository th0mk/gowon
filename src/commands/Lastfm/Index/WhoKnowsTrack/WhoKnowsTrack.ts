import { MessageEmbed } from "discord.js";
import { IndexerError } from "../../../../errors";
import { numberDisplay } from "../../../../helpers";
import { displayLink } from "../../../../helpers/discord";
import { LinkGenerator } from "../../../../helpers/lastFM";
import { Arguments } from "../../../../lib/arguments/arguments";
import { Variation } from "../../../../lib/command/BaseCommand";
import { IndexingBaseCommand } from "../../../../lib/indexing/IndexingCommand";
import {
  WhoKnowsTrackConnector,
  WhoKnowsTrackParams,
  WhoKnowsTrackResponse,
} from "./WhoKnowsTrack.connector";

const args = {
  inputs: {
    artist: { index: 0, splitOn: "|" },
    track: { index: 1, splitOn: "|" },
  },
} as const;

export default class WhoKnowsTrack extends IndexingBaseCommand<
  WhoKnowsTrackResponse,
  WhoKnowsTrackParams,
  typeof args
> {
  connector = new WhoKnowsTrackConnector();

  idSeed = "redsquare lina";

  aliases = ["wkt"];

  rollout = {
    guilds: ["768596255697272862"],
  };

  variations: Variation[] = [{ name: "update", variation: "uwkt" }];

  description = "See who knows a track";
  secretCommand = true;

  arguments: Arguments = args;

  async run() {
    let artistName = this.parsedArguments.artist,
      trackName = this.parsedArguments.track;

    let { senderUsername } = await this.parseMentions({
      senderRequired: !artistName || !trackName,
    });

    if (!artistName || !trackName) {
      let nowPlaying = await this.lastFMService.nowPlayingParsed(
        senderUsername
      );

      if (!artistName) artistName = nowPlaying.artist;
      if (!trackName) trackName = nowPlaying.name;
    } else {
      const lfmTrack = await this.lastFMService.trackInfo({
        artist: artistName,
        track: trackName,
      });

      artistName = lfmTrack.artist.name;
      trackName = lfmTrack.name;
    }

    if (this.variationWasUsed("update")) {
      await this.updateAndWait(senderUsername);
    }

    const response = await this.query({
      track: { name: trackName, artist: { name: artistName } },
      settings: { guildID: this.guild.id, limit: 20 },
    });

    const errors = this.parseErrors(response);

    if (errors) {
      throw new IndexerError(errors.errors[0].message);
    }

    const { rows, track } = response.whoKnowsTrack;

    const embed = new MessageEmbed()
      .setTitle(`Who knows ${track.name.italic()} by ${track.artist.strong()}?`)
      .setDescription(
        !track || rows.length === 0
          ? `No one knows this track`
          : rows.map(
              (wk, index) =>
                `${index + 1}. ${displayLink(
                  wk.user.username,
                  LinkGenerator.userPage(wk.user.username)
                )} - **${numberDisplay(wk.playcount, "**play")}`
            )
      );

    await this.send(embed);
  }
}
