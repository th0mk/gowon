import { CommandGroup } from "../../../lib/command/CommandGroup";
import { LastFMBaseParentCommand } from "../LastFMBaseCommand";
import { Me } from "./Me";
import { Guess } from "./Guess";
import { Hint } from "./Hint";
import { Quit } from "./Quit";

export interface JumbledArtist {
  jumbled: string;
  unjumbled: string;
  currenthint: string;
}

export const jumbleRedisKey = "jumbledArtist";

export default class JumbleParentCommand extends LastFMBaseParentCommand {
  idSeed = "clc eunbin";

  friendlyName = "jumble";
  description =
    "Jumbles an artist from your library for you to guess. See jumble me to generate an artist.";
  extraDescription =
    "\nTo make a guess run `jumble <your guess here>` (or if your guess conflicts with a jumble command, `jumble guess <your guess here>`)";
  subcategory = "games";

  slashCommand = true;

  prefixes = ["jumble", "j"];
  default = () => new Guess();

  children: CommandGroup = new CommandGroup([Me, Hint, Guess, Quit], this.id);
}
