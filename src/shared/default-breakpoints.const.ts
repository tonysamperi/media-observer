import {BreakpointAliases} from "../models/breakpoint-aliases.enum";
import {BreakPoint} from "../models/breakpoint.interface";
import {DEFAULT_BREAKPOINT_QUERIES} from "./default-breakpoint-queries.const";

/**
 * NOTE: Smaller ranges have HIGHER priority since the match is more specific
 */
export const DEFAULT_BREAKPOINTS: BreakPoint[] = [
    {
        alias: BreakpointAliases.xs,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES.xs,
        priority: 1000
    },
    {
        alias: BreakpointAliases.sm,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES.sm,
        priority: 900
    },
    {
        alias: BreakpointAliases.md,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES.md,
        priority: 800
    },
    {
        alias: BreakpointAliases.lg,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES.lg,
        priority: 700
    },
    {
        alias: BreakpointAliases.xl,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES.xl,
        priority: 600
    },
    {
        alias: BreakpointAliases["lt-sm"],
        overlapping: true,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["lt-sm"],
        priority: 950
    },
    {
        alias: BreakpointAliases["lt-md"],
        overlapping: true,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["lt-md"],
        priority: 850
    },
    {
        alias: BreakpointAliases["lt-lg"],
        overlapping: true,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["lt-lg"],
        priority: 750
    },
    {
        alias: BreakpointAliases["lt-xl"],
        overlapping: true,
        priority: 650,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["lt-xl"]
    },
    {
        alias: BreakpointAliases["gt-xs"],
        overlapping: true,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["gt-xs"],
        priority: -950
    },
    {
        alias: BreakpointAliases["gt-sm"],
        overlapping: true,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["gt-sm"],
        priority: -850
    }, {
        alias: BreakpointAliases["gt-md"],
        overlapping: true,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["gt-md"],
        priority: -750
    },
    {
        alias: BreakpointAliases["gt-lg"],
        overlapping: true,
        mediaQuery: DEFAULT_BREAKPOINT_QUERIES["gt-lg"],
        priority: -650
    }
];
