# Media Observer

## What

This is basically the same Media Observer you can find into @angular/flex, with an additional method like the one you
can find in @angular/cdk, in order to check custom media queries (such as `portrait`, or simply media queries not
declared initially. The difference is that this is for javascript/typescript use (e.g. React maybe).

## Why

I think that it's very useful to avoid listening multiple times for window resizes and centralize responsive
behaviours (when CSS media queries aren't enough, of course).

## How

In Angular you can inject the instance, so this version is set for working as a singleton. You won't need to create an
instance calling `new MediaObserverService()` (although in non-typescript projects you may be able to do so). You can
access the singleton instance using the static getter `INSTANCE`.

E.g.:

```javascript
import {MediaObserverService} from "media-observer";

const mosInstance = MediaObserverService.INSTANCE;
```

The **MediaObserverService** will provide mediaQuery **activations** notifications for all registered breakpoints.

This service is essentially an Observable that exposes both features to subscribe to mediaQuery changes and a validator
method `.isActive()` to test if a mediaQuery (or alias) is currently active.

> Only mediaChange activations (not deactivations) are announced by the ObservableMedia!

----

## API Summary

The class **MediaObserverService** service has three (3) APIs:

* `asObservable(): Observable<MediaChange>`
* `isActive(query: string | string[]): boolean`
* `isMatched(query: string | string[]): boolean`

----

### asObservable

This notifies when the current breakpoint is changed and returns the list of all active media queries

```javascript
mosInstance.asObservable()
.pipe(filter((changes: MediaChanges) => changes[0].mqAlias === BreakpointAliases.xs))
.subscribe(() => this.loadMobileContent());
```

### isActive

This allows to check if one of the **registered** media queries is active, by *alias* or by *media query*

```javascript
 if (mosInstance.isActive(BreakpointAliases.xs)) {
    this.loadMobileContent();
}
```

### isMatched

This is basically identical to `isActive`, except it allows to check any media query, even if not registered. So you can
use the method to evaluate one or more media queries against the current viewport size.

```javascript
const PRINT_MOBILE = 'print and (max-width: 599px)';
if (mosInstance.isMatched(PRINT_MOBILE)) {
    this.doSomePrintStuff();
}
```

## Customizing breakpoints

Default breakpoints and aliases are accessible through the following vars:

* `DEFAULT_BREAKPOINT_WIDTHS`: links aliases and media query widths
* `DEFAULT_BREAKPOINTS`: the default breakpoint items that will be watched as soon as MediaObserverService is
  instantiated
* `BreakpointAliases`: contains all the standard aliases (you can use your own if you prefer)

To change the default breakpoints and use your own, just call the **static
method** `MediaObserverService.setBreakpoints`, passing the list (an *Array* of `BreakPoint`) of your breakpoints, **
before** anyone calls `MediaObserverService.INSTANCE`.

To change the breakpoints after initialization you can call `MediaObserverService.INSTANCE.destroy`, which will destroy
the active instance.

### Default breakpoints

```typescript

export interface BreakPoint {
    alias: BreakpointAliases | string;
    mediaQuery: string;
    overlapping?: boolean;  // Does this range overlap with any other ranges
    priority?: number;      // determine order of activation reporting: higher is last reported
    suffix?: string;
}

// Generated
export const DEFAULT_BREAKPOINTS: BreakPoint[] = [
    {
        alias: BreakpointAliases.xs,
        mediaQuery: "screen and (min-width: 0px) and (max-width: 599.98px)",
        priority: 1000
    },
    {
        alias: BreakpointAliases.sm,
        mediaQuery: "screen and (min-width: 600px) and (max-width: 959.98px)",
        priority: 900
    },
    {
        alias: BreakpointAliases.md,
        mediaQuery: "screen and (min-width: 960px) and (max-width: 1279.98px)",
        priority: 800
    },
    {
        alias: BreakpointAliases.lg,
        mediaQuery: "screen and (min-width: 1280px) and (max-width: 1919.98px)",
        priority: 700
    },
    {
        alias: BreakpointAliases.xl,
        mediaQuery: "screen and (min-width: 1920px) and (max-width: 4999.98px)",
        priority: 600
    },
    {
        alias: BreakpointAliases["lt-sm"],
        overlapping: true,
        mediaQuery: "screen and (max-width: 599.98px)",
        priority: 950
    },
    {
        alias: BreakpointAliases["lt-md"],
        overlapping: true,
        mediaQuery: "screen and (max-width: 959.98px)",
        priority: 850
    },
    {
        alias: BreakpointAliases["lt-lg"],
        overlapping: true,
        mediaQuery: "screen and (max-width: 1279.98px)",
        priority: 750
    },
    {
        alias: BreakpointAliases["lt-xl"],
        overlapping: true,
        priority: 650,
        mediaQuery: "screen and (max-width: 1919.98px)",
    },
    {
        alias: BreakpointAliases["gt-xs"],
        overlapping: true,
        mediaQuery: "screen and (min-width: 600px)",
        priority: -950
    },
    {
        alias: BreakpointAliases["gt-sm"],
        overlapping: true,
        mediaQuery: "screen and (min-width: 960px)",
        priority: -850
    }, {
        alias: BreakpointAliases["gt-md"],
        overlapping: true,
        mediaQuery: "screen and (min-width: 1280px)",
        priority: -750
    },
    {
        alias: BreakpointAliases["gt-lg"],
        overlapping: true,
        mediaQuery: "screen and (min-width: 1920px)",
        priority: -650
    }
];

```

