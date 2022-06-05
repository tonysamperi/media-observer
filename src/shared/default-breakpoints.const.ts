import {BreakPoint} from "../models/breakpoint.interface";
import {DEFAULT_BREAKPOINT_WIDTHS} from "./default-breakpoint-widhts.const";
import {Utils} from "./utils.class";

/**
 * NOTE: Smaller ranges have HIGHER priority since the match is more specific
 */
export const DEFAULT_BREAKPOINTS: BreakPoint[] = Utils.buildBreakpoints(DEFAULT_BREAKPOINT_WIDTHS);
