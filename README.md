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

This is basically identical to `isActive`, except it allows to check any media query, even if not registered.
So you can use the method to evaluate one or more media queries against the current viewport size.

```javascript
const PRINT_MOBILE = 'print and (max-width: 599px)';
if (mosInstance.isMatched(PRINT_MOBILE)) {
    this.doSomePrintStuff();
}
```

## Customizing breakpoints

Default breakpoints and aliases are accessible through the following vars:

* `DEFAULT_BREAKPOINT_QUERIES`: links aliases and media queries
* `DEFAULT_BREAKPOINTS`: the default breakpoint items that will be watched as soon as MediaObserverService is instantiated
* `BreakpointAliases`: contains all the standard aliases (you can use your own if you prefer)

To change the default breakpoints and use your own, just call the **static method** `MediaObserverService.setBreakpoints`,
passing the list (an *Array* of `BreakPoint`) of your breakpoints, **before anyone calls `MediaObserverService.INSTANCE`.

To change the breakpoints after initialization you can call `MediaObserverService.INSTANCE.destroy`, which will destroy the active instance.

