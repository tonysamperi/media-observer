import {BreakpointAliases} from "../models/breakpoint-aliases.enum";

export const DEFAULT_BREAKPOINT_QUERIES: Record<BreakpointAliases, string> = {
    // BASE
    [BreakpointAliases.xs]: "screen and (min-width: 0px) and (max-width: 599.98px)",
    [BreakpointAliases.sm]: "screen and (min-width: 600px) and (max-width: 959.98px)",
    [BreakpointAliases.md]: "screen and (min-width: 960px) and (max-width: 1279.98px)",
    [BreakpointAliases.lg]: "screen and (min-width: 1280px) and (max-width: 1919.98px)",
    [BreakpointAliases.xl]: "screen and (min-width: 1920px) and (max-width: 4999.98px)",
    // LT
    [BreakpointAliases["lt-sm"]]: "screen and (max-width: 599.98px)",
    [BreakpointAliases["lt-md"]]: "screen and (max-width: 959.98px)",
    [BreakpointAliases["lt-lg"]]: "screen and (max-width: 1279.98px)",
    [BreakpointAliases["lt-xl"]]: "screen and (max-width: 1919.98px)",
    // GT
    [BreakpointAliases["gt-xs"]]: "screen and (min-width: 600px)",
    [BreakpointAliases["gt-sm"]]: "screen and (min-width: 960px)",
    [BreakpointAliases["gt-md"]]: "screen and (min-width: 1280px)",
    [BreakpointAliases["gt-lg"]]: "screen and (min-width: 1920px)"
};
