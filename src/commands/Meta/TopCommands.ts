import { MetaChildCommand } from "./MetaChildCommand";
import { displayNumber } from "../../lib/views/displays";
import { TimeRangeArgument } from "../../lib/context/arguments/argumentTypes/timeAndDate/TimeRangeArgument";
import { bold } from "../../helpers/discord";
import { humanizeTimeRange } from "../../lib/timeAndDate/helpers/humanize";
import { TimeRange } from "../../lib/timeAndDate/TimeRange";
import { ArgumentsMap } from "../../lib/context/arguments/types";

const args = {
  timeRange: new TimeRangeArgument({
    useOverall: false,
    default: () => TimeRange.fromDuration({ weeks: 1 }),
  }),
} satisfies ArgumentsMap;

export class TopCommands extends MetaChildCommand<typeof args> {
  idSeed = "eunha";

  description = "Shows the most used commands over a given time period";
  usage = ["", "time period"];

  arguments = args;

  async run() {
    const timeRange = this.parsedArguments.timeRange;
    const humanizedTimeRange = humanizeTimeRange(timeRange, {
      useOverall: false,
    });

    const topCommands = (
      await this.metaService.mostUsedCommands(this.ctx, timeRange)
    ).slice(0, 10);

    const embed = this.newEmbed()
      .setTitle(`Top commands in ${this.guild?.name!} ${humanizedTimeRange}`)
      .setDescription(
        topCommands
          .map(
            (tc) =>
              `${displayNumber(tc.count, "run")} - ${bold(
                this.commandRegistry.findByID(tc.commandID)
                  ?.friendlyNameWithParent ?? "[unknown command]"
              )}`
          )
          .join("\n")
      );

    await this.send(embed);
  }
}
