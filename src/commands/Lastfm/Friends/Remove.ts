import { FriendsChildCommand } from "./FriendsChildCommand";
import { Message } from "discord.js";
import { Arguments } from "../../../lib/arguments/arguments";
import { LogicError } from "../../../errors";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { standardMentions } from "../../../lib/arguments/mentions/mentions";

const args = {
  inputs: {
    friendUsername: { index: 0 },
  },
  mentions: standardMentions,
};

export class Remove extends FriendsChildCommand<typeof args> {
  idSeed = "nature haru";

  description = "Removes a friend";
  usage = ["lfm_username", "@user"];

  arguments: Arguments = args;

  validation: Validation = {
    user: {
      validator: new validators.Required({
        message: "please specify a friend to remove!",
      }),
      dependsOn: ["friendUsername", "userID", "lfmUser"],
    },
  };

  async prerun() {}

  async run(message: Message) {
    let { username, senderUsername } = await this.parseMentions({
      inputArgumentName: "friendUsername",
    });

    if (username === senderUsername)
      throw new LogicError("you can't be friends with yourself!");

    let user = await this.usersService.getUser(message.author.id);

    await this.friendsService.removeFriend(user, username);

    await this.send(
      this.newEmbed().setDescription(
        `Successfully removed ${username.code()} as a friend!`
      )
    );
  }
}
