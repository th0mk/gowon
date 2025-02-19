import { LastFMBaseCommand } from "../Lastfm/LastFMBaseCommand";

// Here for archival purposes
export default class ScraperAlbumTopTracks extends LastFMBaseCommand {
  idSeed = "nature sunshine";

  archived = true;

  description = "Shows your top tracks from an album";
  aliases = ["sltt"];
  usage = ["", "artist | album @user"];
  subcategory = "library";

  async run() {}
}
