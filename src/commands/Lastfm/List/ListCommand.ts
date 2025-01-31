import { LastFMBaseCommand } from "../LastFMBaseCommand";
import { LastFMPeriod } from "../../../services/LastFM/LastFMService.types";
import { Validation } from "../../../lib/validation/ValidationChecker";
import { validators } from "../../../lib/validation/validators";
import { standardMentions } from "../../../lib/context/arguments/mentionTypes/mentions";
import { TimePeriodArgument } from "../../../lib/context/arguments/argumentTypes/timeAndDate/TimePeriodArgument";
import { TimeRangeArgument } from "../../../lib/context/arguments/argumentTypes/timeAndDate/TimeRangeArgument";
import { NumberArgument } from "../../../lib/context/arguments/argumentTypes/NumberArgument";
import { TimeRange } from "../../../lib/timeAndDate/TimeRange";
import { humanizePeriod } from "../../../lib/timeAndDate/helpers/humanize";
import { ArgumentsMap } from "../../../lib/context/arguments/types";

const args = {
  timePeriod: new TimePeriodArgument({
    default: "7day",
    description: "The time period to use",
  }),
  timeRange: new TimeRangeArgument({ description: "The time range to use" }),
  listAmount: new NumberArgument({
    default: 10,
    description: "The number of entries to show",
  }),
  ...standardMentions,
} satisfies ArgumentsMap;

export abstract class ListCommand extends LastFMBaseCommand<typeof args> {
  idSeed = "stayc j";

  subcategory = "lists";
  usage = ["", "time period list_amount @user"];

  arguments = args;

  slashCommand = true;

  validation: Validation = {
    listAmount: {
      validator: new validators.RangeValidator({ min: 1, max: 25 }),
      friendlyName: "amount",
    },
  };

  timeRange?: TimeRange;
  timePeriod!: LastFMPeriod;
  humanizedPeriod!: string;
  listAmount!: number;

  async beforeRun(): Promise<void> {
    this.timeRange = this.parsedArguments.timeRange;
    this.timePeriod = this.parsedArguments.timePeriod;
    this.listAmount = this.parsedArguments.listAmount;
    this.humanizedPeriod = humanizePeriod(this.timePeriod);
  }
}
