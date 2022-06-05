import {BreakpointAliases} from "./breakpoint-aliases.enum";

export interface BreakPoint {
    alias: BreakpointAliases | string;
    mediaQuery: string;
    overlapping?: boolean;  // Does this range overlap with any other ranges
    priority?: number;      // determine order of activation reporting: higher is last reported
    suffix?: string;
}
