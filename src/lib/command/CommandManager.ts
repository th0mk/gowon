import { Command, NoCommand } from "./BaseCommand";
import { promisify } from "util";
import _glob from "glob";
import { AliasChecker, RunAs } from "../AliasChecker";
import { flatDeep } from "../../helpers";
const glob = promisify(_glob);

interface Commands {
  [key: string]: () => Command;
}

async function generateCommands(): Promise<Commands> {
  console.log(
    require("path").dirname(require.main?.filename) + "/commands/**/*.js"
  );

  let files = await glob(
    require("path").dirname(require.main?.filename) + "/commands/**/*.js"
  );

  return files.reduce((acc, file) => {
    let command = require(file).default;

    if (command?.constructor) {
      let commandNameSplit = file.split("/");

      let commandName = commandNameSplit[commandNameSplit.length - 1]
        .slice(0, -3)
        .toLowerCase();

      acc[commandName] = () => new command();
    }

    return acc;
  }, {} as Commands);
}

export class CommandManager {
  isInitialized = false;

  constructor(public commands: Commands = {}) {}

  async init() {
    this.commands = await generateCommands();
    this.isInitialized = true;
  }

  find(messageString: string): { command: Command; runAs: RunAs } {
    let checker = new AliasChecker(messageString);

    for (let command of this.list(true)) {
      if (checker.check(command)) {
        let runAs = checker.getRunAs(command);
        return {
          command: runAs.last()?.command!,
          runAs,
        };
      }
    }
    return { command: new NoCommand(), runAs: new RunAs() };
  }

  findByID(id: string): Command | undefined {
    return this.deepList().find((c) => c.id === id);
  }

  list(showSecret: boolean = false): Command[] {
    let commandGetterList = Object.values(this.commands).sort();

    let commandsList = commandGetterList
      .map((c) => c())
      .filter((c) => (c.parentName ? true : c.shouldBeIndexed));

    return showSecret
      ? commandsList
      : commandsList.filter((c) => !c.secretCommand);
  }

  deepList(showSecret: boolean = false): Command[] {
    let shallowCommands = this.list();

    return flatDeep<Command>(
      shallowCommands.map((sc) =>
        sc.hasChildren ? [sc, ...(sc.children?.deepList(showSecret) || [])] : sc
      )
    ).filter((c) => showSecret || !c.secretCommand);
  }
}
