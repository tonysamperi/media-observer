import {BreakPoint} from "../models/breakpoint.interface";
import {BreakPointRegistry} from "../models/breakpoints-registry.class";
import {MediaChange} from "../models/media-change.class";
import {Utils} from "../shared/utils.class";
import {OptionalBreakpoint} from "../models/optional-breakpoint.type";
import {DEFAULT_BREAKPOINTS} from "../shared/default-breakpoints.const";

/**
 * Interface to apply PrintHook to call anonymous `target.updateStyles()`
 */
export interface HookTarget {
    activatedBreakpoints: BreakPoint[];

    updateStyles(): void;
}

const PRINT = "print";
export const BREAKPOINT_PRINT = {
    alias: PRINT,
    mediaQuery: PRINT,
    priority: 1000
};

/**
 * PrintHookService - Use to intercept print MediaQuery activations and force
 *             layouts to render with the specified print alias/breakpoint
 *
 * Used in MediaMarshaller and MediaObserver
 */
export class PrintHookService {

    static get INSTANCE(): PrintHookService {
        return this._INSTANCE || new PrintHookService();
    }

    private static _BREAKPOINTS = DEFAULT_BREAKPOINTS;
    private static _INSTANCE?: PrintHookService;

    protected _breakpoints: BreakPointRegistry = new BreakPointRegistry(PrintHookService._BREAKPOINTS);
    protected _document: any = document;
    // tslint:disable-next-line:ban-types
    private afterPrintEventListeners: Function[] = [];

    // tslint:disable-next-line:ban-types
    private beforePrintEventListeners: Function[] = [];
    private deactivations: BreakPoint[] = [];

    private formerActivations: Array<BreakPoint> | null = null;

    // Is this service currently in print mode
    private isPrinting = false;

    // isPrintingBeforeAfterEvent is used to track if we are printing from within
    // a `beforeprint` event handler. This prevents the typical `stopPrinting`
    // form `interceptEvents` so that printing is not stopped while the dialog
    // is still open. This is an extension of the `isPrinting` property on
    // browsers which support `beforeprint` and `afterprint` events.
    private isPrintingBeforeAfterEvent = false;
    private queue = new PrintQueue();


    // registeredBeforeAfterPrintHooks tracks if we registered the `beforeprint`
    //  and `afterprint` event listeners.
    private registeredBeforeAfterPrintHooks = false;

    constructor() {
    }

    static setBreakpoints(breakpoints: BreakPoint[]): void {
        this._BREAKPOINTS = breakpoints;
    }

    /** Stop mediaChange event propagation in event streams */
    blockPropagation() {
        return (event: MediaChange): boolean => {
            return !(this.isPrinting || this.isPrintEvent(event));
        };
    }

    /**
     * To restore pre-Print Activations, we must capture the proper
     * list of breakpoint activations BEFORE print starts. OnBeforePrint()
     * is supported; so 'print' mediaQuery activations are used as a fallback
     * in browsers without `beforeprint` support.
     *
     * >  But activated breakpoints are deactivated BEFORE 'print' activation.
     *
     * Let's capture all de-activations using the following logic:
     *
     *  When not printing:
     *    - clear cache when activating non-print breakpoint
     *    - update cache (and sort) when deactivating
     *
     *  When printing:
     *    - sort and save when starting print
     *    - restore as activatedTargets and clear when stop printing
     */
    collectActivations(target: HookTarget, event: MediaChange) {
        if (!this.isPrinting || this.isPrintingBeforeAfterEvent) {
            if (!this.isPrintingBeforeAfterEvent) {
                // Only clear deactivations if we aren't printing from a `beforeprint` event.
                // Otherwise, this will clear before `stopPrinting()` is called to restore
                // the pre-Print Activations.
                this.deactivations = [];

                return;
            }

            if (!event.matches) {
                const bp = this._breakpoints.findByQuery(event.mediaQuery);
                // Deactivating a breakpoint
                if (bp) {
                    const hasFormerBp = this.formerActivations && this.formerActivations.includes(bp);
                    const wasActivated = !this.formerActivations && target.activatedBreakpoints.includes(bp);
                    const shouldDeactivate = hasFormerBp || wasActivated;
                    if (shouldDeactivate) {
                        this.deactivations.push(bp);
                        this.deactivations.sort(Utils.sortDescendingPriority);
                    }
                }
            }
        }
    }

    /** Teardown logic for the service. */
    destroy() {
        if (this._document.defaultView) {
            this.beforePrintEventListeners.forEach(l => this._document.defaultView.removeEventListener("beforeprint", l));
            this.afterPrintEventListeners.forEach(l => this._document.defaultView.removeEventListener("afterprint", l));
        }
    }

    /** Lookup breakpoint associated with mediaQuery */
    getEventBreakpoints({mediaQuery}: MediaChange): BreakPoint[] {
        const bp = this._breakpoints.findByQuery(mediaQuery);
        const list = bp ? [bp] : [];

        return list.sort(Utils.sortDescendingPriority);
    }

    /**
     * Prepare RxJS tap operator with partial application
     * @return pipeable tap predicate
     */
    interceptEvents(target: HookTarget) {
        return (event: MediaChange) => {
            if (this.isPrintEvent(event)) {
                if (event.matches && !this.isPrinting) {
                    this.startPrinting(target, this.getEventBreakpoints(event));
                    target.updateStyles();
                } else if (!event.matches && this.isPrinting && !this.isPrintingBeforeAfterEvent) {
                    this.stopPrinting(target);
                    target.updateStyles();
                }

                return;
            }

            this.collectActivations(target, event);
        };
    }

    /** Is the MediaChange event for any 'print' @media */
    isPrintEvent(e: MediaChange): boolean {
        return e.mediaQuery.startsWith(PRINT);
    }

    // registerBeforeAfterPrintHooks registers a `beforeprint` event hook so we can
    // trigger print styles synchronously and apply proper layout styles.
    // It is a noop if the hooks have already been registered or if the document's
    // `defaultView` is not available.
    registerBeforeAfterPrintHooks(target: HookTarget) {
        // `defaultView` may be null when rendering on the server or in other contexts.
        if (!this._document.defaultView || this.registeredBeforeAfterPrintHooks) {
            return;
        }

        this.registeredBeforeAfterPrintHooks = true;

        const beforePrintListener = () => {
            // If we aren't already printing, start printing and update the styles as
            // if there was a regular print `MediaChange`(from matchMedia).
            if (!this.isPrinting) {
                this.isPrintingBeforeAfterEvent = true;
                this.startPrinting(target, this.getEventBreakpoints(new MediaChange(true, PRINT)));
                target.updateStyles();
            }
        };

        const afterPrintListener = () => {
            // If we aren't already printing, start printing and update the styles as
            // if there was a regular print `MediaChange`(from matchMedia).
            this.isPrintingBeforeAfterEvent = false;
            if (this.isPrinting) {
                this.stopPrinting(target);
                target.updateStyles();
            }
        };

        // Could we have teardown logic to remove if there are no print listeners being used?
        this._document.defaultView.addEventListener("beforeprint", beforePrintListener);
        this._document.defaultView.addEventListener("afterprint", afterPrintListener);

        this.beforePrintEventListeners.push(beforePrintListener);
        this.afterPrintEventListeners.push(afterPrintListener);
    }

    /** Update event with printAlias mediaQuery information */
    updateEvent(event: MediaChange): MediaChange {
        let bp: OptionalBreakpoint = this._breakpoints.findByQuery(event.mediaQuery);

        if (this.isPrintEvent(event)) {
            // Reset from 'print' to first (highest priority) print breakpoint
            bp = this.getEventBreakpoints(event)[0];
            event.mediaQuery = bp?.mediaQuery ?? "";
        }

        return Utils.mergeAlias(event, bp);
    }

    /** Add 'print' mediaQuery: to listen for matchMedia activations */
    withPrintQuery(queries: string[]): string[] {
        return [...queries, PRINT];
    }

    /**
     * Save current activateBreakpoints (for later restore)
     * and substitute only the printAlias breakpoint
     */
    protected startPrinting(target: HookTarget, bpList: OptionalBreakpoint[]) {
        this.isPrinting = true;
        this.formerActivations = target.activatedBreakpoints;
        target.activatedBreakpoints = this.queue.addPrintBreakpoints(bpList);
    }

    /** For any print de-activations, reset the entire print queue */
    protected stopPrinting(target: HookTarget) {
        target.activatedBreakpoints = this.deactivations;
        this.deactivations = [];
        this.formerActivations = null;
        this.queue.clear();
        this.isPrinting = false;
    }
}

// ************************************************************************
// Internal Utility class 'PrintQueue'
// ************************************************************************

/**
 * Utility class to manage print breakpoints + activatedBreakpoints
 * with correct sorting WHILE printing
 */
class PrintQueue {
    /** Sorted queue with prioritized print breakpoints */
    printBreakpoints: BreakPoint[] = [];

    /** Add Print breakpoint to queue */
    addBreakpoint(bp: OptionalBreakpoint) {
        if (!!bp) {
            const bpInList = this.printBreakpoints.find(it => it.mediaQuery === bp.mediaQuery);

            if (bpInList === undefined) {
                // If this is a `printAlias` breakpoint, then append. If a true 'print' breakpoint,
                // register as highest priority in the queue
                this.printBreakpoints = isPrintBreakPoint(bp) ? [bp, ...this.printBreakpoints]
                    : [...this.printBreakpoints, bp];
            }
        }
    }

    addPrintBreakpoints(bpList: OptionalBreakpoint[]): BreakPoint[] {
        bpList.push(BREAKPOINT_PRINT);
        bpList.sort(Utils.sortDescendingPriority);
        bpList.forEach(bp => this.addBreakpoint(bp));

        return this.printBreakpoints;
    }

    /** Restore original activated breakpoints and clear internal caches */
    clear() {
        this.printBreakpoints = [];
    }
}

// ************************************************************************
// Internal Utility methods
// ************************************************************************

/** Only support intercept queueing if the Breakpoint is a print @media query */
function isPrintBreakPoint(bp: OptionalBreakpoint): boolean {
    return bp?.mediaQuery.startsWith(PRINT) ?? false;
}
