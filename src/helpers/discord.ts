import { GuildMember, MessageReaction, User } from "discord.js";
import escapeStringRegexp from "escape-string-regexp";

export function sanitizeForDiscord(string: string): string {
  const characters = ["||", "*", "_", "`"];

  for (let character of characters) {
    string = string.replace(
      new RegExp(escapeStringRegexp(character), "g"),
      (match) => `\\${match}`
    );
  }

  return string.replace(/\n/g, " ");
}

export function userHasRole(
  member: GuildMember | undefined,
  roleID: string | undefined
): boolean {
  if (!roleID || !member) {
    return false;
  }

  return member.roles.cache.has(roleID);
}

export function cleanURL(url: string): string {
  return url
    .replace(/\)/g, "%29")
    .replace(/\(/g, "%28")
    .replace(/,/g, "%2C")
    .replace(/_/g, "%5f");
}

export type ReactionCollectorFilter = (
  reaction: MessageReaction,
  user: User
) => boolean;

export function serverIconURL(guildID: string, icon: string) {
  if (icon.startsWith("a_")) {
    return `https://cdn.discordapp.com/icons/${guildID}/${icon}.gif?size=64`;
  } else {
    return `https://cdn.discordapp.com/icons/${guildID}/${icon}.webp?size=64`;
  }
}

export function bold(string: string, sanitize = true) {
  return "**" + (sanitize ? sanitizeForDiscord(string) : string) + "**";
}

export function italic(string: string, sanitize = true) {
  return "_" + (sanitize ? sanitizeForDiscord(string) : string) + "_";
}

export function code(string: string) {
  return "`" + string + "`";
}

export function strikethrough(string: string, sanitize = true) {
  return "~~" + (sanitize ? sanitizeForDiscord(string) : string) + "~~";
}

export function mentionChannel(channelID: string): string {
  return `<#${channelID}>`;
}

export function mentionGuildMember(userID: string): string {
  return `<@!${userID}>`;
}

export function mentionRole(roleID: string): string {
  return `<@&${roleID}>`;
}

export function userMentionAtStartRegex(userID: string): RegExp {
  return new RegExp(`^\\s*<@!?${userID}>`);
}

export function fishyRegex(botID: string): RegExp {
  return new RegExp(
    `^.{1,2}(fishy|fish|fihy|fisy|foshy|fisyh|fsihy|fin|fush)\\s+<@!?${botID}>.*`,
    "i"
  );
}

export function caughtFishiesRegex(): RegExp {
  return /(\*\*)?\d+(\*\*)? fish(y|ies)(\*\*)?/;
}
