import { CommandGroup } from "../../lib/command/CommandGroup";
import { ParentCommand } from "../../lib/command/ParentCommand";
import { Bank } from "./Bank";
import { Inventory } from "./Inventory";
import { Mint } from "./Mint";
import { View } from "./View";
import { Work } from "./Work";

export default class CardsParentCommand extends ParentCommand {
  idSeed = "ive wonyoung";

  description = "Allows you to manage your cards";
  friendlyName = "cards";

  prefixes = ["cards"];
  default = () => new Inventory();

  category = "lastfm";
  subcategory = "games";

  noPrefixAliases = [
    // View
    "card",
    // Mint
    "mint",
    // Bank
    "bank",
    // Work
    "work",
    // Inventory
    "inventory",
  ];

  children = new CommandGroup([Bank, Inventory, Mint, View, Work], this.id);
}
