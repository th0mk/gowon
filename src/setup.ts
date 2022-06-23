import config from "../config.json";

import chalk from "chalk";
import { Client } from "discord.js";
import { GraphQLAPI } from "./api";
import { DB } from "./database";
import { Stopwatch, ucFirst } from "./helpers";
import { CommandHandler } from "./lib/command/CommandHandler";
import { GowonClient } from "./lib/GowonClient";
import { GuildEventService } from "./services/Discord/GuildEventService";
import { RedisInteractionService } from "./services/redis/RedisInteractionService";
import { mirrorballClient } from "./lib/indexing/client";
import gql from "graphql-tag";
import { ServiceRegistry } from "./services/ServicesRegistry";
import { SettingsService } from "./lib/settings/SettingsService";
import { InteractionHandler } from "./lib/command/interactions/InteractionHandler";
import { TwitterService } from "./services/Twitter/TwitterService";
import { CommandRegistry } from "./lib/command/CommandRegistry";

export const client = new GowonClient(
  new Client({
    // List of intents: https://discord.com/developers/docs/topics/gateway#list-of-intents
    intents: [
      "GUILDS",
      "GUILD_MEMBERS",
      "GUILD_MESSAGES",
      "GUILD_MESSAGE_REACTIONS",
      "GUILD_MESSAGE_TYPING",
      "DIRECT_MESSAGES",
      "DIRECT_MESSAGE_REACTIONS",
      "DIRECT_MESSAGE_TYPING",
    ],
    presence: {
      status: "online",
      activities: [
        {
          name: "One & Only",
          type: "LISTENING",
          url: "https://gowon.ca",
        },
      ],
    },
  }),
  config.environment
);

export const handler = new CommandHandler();
export const interactionHandler = new InteractionHandler();
const db = new DB();
const api = new GraphQLAPI(client);
const settingsService = ServiceRegistry.get(SettingsService);
const redisService = ServiceRegistry.get(RedisInteractionService);
export const guildEventService = ServiceRegistry.get(GuildEventService);
export const twitterService = ServiceRegistry.get(TwitterService);

export async function setup() {
  console.log(
    chalk`{cyan ${
      asciiArt + "\n" + "=".repeat(asciiArt.split("\n").reverse()[0].length)
    }}\n{yellow -${ucFirst(config.environment)}-}\n`
  );

  await Promise.all([
    connectToDB(),
    connectToRedis(),
    connectToMirrorball(),
    intializeAPI(),
    initializeCommandRegistry(),
  ]);

  // These depend on other initilzations above
  await Promise.all([
    // SettingsManager needs the database to be connected to cache settings
    initializeSettingsManager(),
    // The interaction handler depends on the command registry
    initializeInteractions(),
  ]);

  // These depend on other initializations above
  await Promise.all([
    // The twitter stream needs the settings to be available
    buildTwitterStream(),
  ]);
}

function connectToDB() {
  return logStartup(() => db.connect(), "Connected to database");
}

function connectToRedis() {
  return logStartup(() => redisService.init(), "Connected to Redis");
}

function buildTwitterStream() {
  return logStartup(
    () => twitterService.buildStream(),
    "Created Twitter stream"
  );
}

function intializeAPI() {
  return logStartup(() => api.init(), "Initialized API");
}

function initializeSettingsManager() {
  return logStartup(
    () => settingsService.init(),
    "Initialized settings manager"
  );
}

function initializeInteractions() {
  return logStartup(
    () => interactionHandler.init(),
    "Initialized interactions"
  );
}

function connectToMirrorball() {
  return logStartup(async () => {
    await mirrorballClient.query({
      query: gql`
        query {
          ping
        }
      `,
    });
  }, "Connected to Mirrorball");
}

function initializeCommandRegistry() {
  return logStartup(
    () => CommandRegistry.getInstance().init(),
    "Initialized command registry"
  );
}

async function logStartup(func: () => any, logItem: string): Promise<void> {
  const stopwatch = new Stopwatch();
  stopwatch.start();
  try {
    await Promise.resolve(func());
  } catch (e) {
    console.log(
      chalk`{red ${logItem}${" ".repeat(32 - logItem.length)} FAILED}`
    );
    console.error(e);
    return;
  }
  stopwatch.stop();

  console.log(
    chalk`{white ${logItem}}${" ".repeat(
      32 - logItem.length
    )} {grey ${Math.ceil(stopwatch.elapsedInMilliseconds)} ms}`
  );
}

const asciiArt = `

.d8888b.                                           
d88P  Y88b                                          
888    888                                          
888         .d88b.  888  888  888  .d88b.  88888b.  
888  88888 d88""88b 888  888  888 d88""88b 888 "88b 
888    888 888  888 888  888  888 888  888 888  888 
Y88b  d88P Y88..88P Y88b 888 d88P Y88..88P 888  888 
 "Y8888P88  "Y88P"   "Y8888888P"   "Y88P"  888  888  고원  `;
