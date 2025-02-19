import { ValidatorOptions, BaseValidator } from "./BaseValidator";
import { TimeRange } from "../../../lib/timeAndDate/TimeRange";

interface TimeRangeValidatorOptions extends ValidatorOptions {
  requireFrom?: boolean;
  requireTo?: boolean;
  treatOnlyToAsEmpty?: boolean;
}

export class TimeRangeValidator extends BaseValidator<TimeRangeValidatorOptions> {
  validate(arg: TimeRange | undefined, argName: string) {
    if (!arg || (this.options.treatOnlyToAsEmpty && !arg.from)) return;

    if (
      (this.options.requireFrom && !arg.from) ||
      (this.options.requireFrom && !arg.to)
    ) {
      this.throw(`please enter a valid ${argName}!`);
    }
  }
}
