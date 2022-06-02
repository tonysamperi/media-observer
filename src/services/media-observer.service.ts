import {MediaChange} from "../models/media-change.class";
import {MatchMediaService} from "./match-media.service";
import {OptionalBreakpoint} from "../models/optional-breakpoint.type";
import {BreakPointRegistry} from "../models/breakpoints-registry.class";
import {Utils} from "../shared/utils.class";
import {PrintHookService} from "./print-hook.service";
import {DEFAULT_BREAKPOINTS} from "../shared/default-breakpoints.const";
import {BreakPoint} from "../models/breakpoint.interface";
//
import {Subject, asapScheduler, Observable, of} from "rxjs";
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    switchMap,
    takeUntil
} from "rxjs/operators";


/**
 * MediaObserverService enables applications to listen for 1..n mediaQuery activations and to determine
 * if a mediaQuery is currently activated.
 *
 * Since a breakpoint change will first deactivate 1...n mediaQueries and then possibly activate
 * 1..n mediaQueries, the MediaObserver will debounce notifications and report ALL *activations*
 * in 1 event notification. The reported activations will be sorted in descending priority order.
 *
 * This class uses the BreakPoint Registry to inject alias information into the raw MediaChange
 * notification. For custom mediaQuery notifications, alias information will not be injected and
 * those fields will be ''.
 *
 * Note: Developers should note that only mediaChange activations (not de-activations)
 *       are announced by the MediaObserver.
 *
 *  @usage
 *
 *  // RxJS
 *  import { filter } from 'rxjs/operators';
 *  import { MediaObserver } from 'media-query-observer';
 *
 *  export class MyClass {
 *
 *    mediaObserver: MediaObserver = MediaObserver.INSTANCE;
 *    status: string = '';
 *
 *    constructor() {
 *      const media$ = mediaObserver.asObservable().pipe(
 *        filter((changes: MediaChange[]) => true)   // silly noop filter
 *      );
 *
 *      media$.subscribe((changes: MediaChange[]) => {
 *        let status = '';
 *        changes.forEach( change => {
 *          status += `'${change.mqAlias}' = (${change.mediaQuery}) <br/>` ;
 *        });
 *        this.status = status;
 *     });
 *
 *    }
 *  }
 */
export class MediaObserverService {

    static get INSTANCE(): MediaObserverService {
        this._INSTANCE || (this._INSTANCE = new MediaObserverService());

        return this._INSTANCE;
    }

    protected static _BREAKPOINTS = DEFAULT_BREAKPOINTS;
    protected static _INSTANCE?: MediaObserverService;

    /** Filter MediaChange notifications for overlapping breakpoints */
    filterOverlaps = false;

    /**
     * @deprecated Use `asObservable()` instead.
     * @breaking-change 8.0.0-beta.25
     * @deletion-target 10.0.0
     */
    readonly media$: Observable<MediaChange>;

    protected _breakpoints: BreakPointRegistry = new BreakPointRegistry(MediaObserverService._BREAKPOINTS);
    protected _hook: PrintHookService = PrintHookService.INSTANCE;
    protected _matchMedia: MatchMediaService = MatchMediaService.INSTANCE;

    protected readonly _media$: Observable<MediaChange[]>;
    protected readonly destroyed$ = new Subject<void>();

    protected constructor() {
        this._media$ = this._watchActivations();
        this.media$ = this._media$.pipe(
            filter((changes: MediaChange[]) => changes.length > 0),
            map((changes: MediaChange[]) => changes[0])
        );
    }

    static setBreakpoints(breakpoints: BreakPoint[]): void {
        this._BREAKPOINTS = breakpoints;
    }

    // ************************************************
    // Public Methods
    // ************************************************

    /**
     * Observe changes to current activation 'list'
     */
    asObservable(): Observable<MediaChange[]> {
        return this._media$;
    }

    /**
     * Completes the active subject, signalling to all complete for all
     * MediaObserver subscribers
     */
    destroy(): void {
        MediaObserverService._INSTANCE = void 0;
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    /**
     * Allow programmatic query to determine if one or more media query/alias match
     * the current viewport size.
     * @param value One or more media queries (or aliases) to check.
     * @returns Whether any of the media queries match.
     */
    isActive(value: string | string[]): boolean {
        const aliases = splitQueries(Utils.coerceArray(value));

        return aliases.some(alias => {
            const query = toMediaQuery(alias, this._breakpoints);

            return query !== null && this._matchMedia.isActive(query);
        });
    }

    /**
     * Whether one or more media queries match the current viewport size.
     * @param value One or more media queries to check.
     * @returns Whether any of the media queries match.
     */
    isMatched(value: string | string[]): boolean {
        const queries = splitQueries(Utils.coerceArray(value));

        return queries.some(mediaQuery => this._matchMedia.registerQuery(mediaQuery)[0].matches);
    }

    // ************************************************
    // Internal Methods
    // ************************************************


    /**
     * Only pass/announce activations (not de-activations)
     *
     * Since multiple-mediaQueries can be activation in a cycle,
     * gather all current activations into a single list of changes to observers
     *
     * Inject associated (if any) alias information into the MediaChange event
     * - Exclude mediaQuery activations for overlapping mQs. List bounded mQ ranges only
     * - Exclude print activations that do not have an associated mediaQuery
     *
     * NOTE: the raw MediaChange events [from MatchMedia] do not
     *       contain important alias information; as such this info
     *       must be injected into the MediaChange
     */
    private _buildObservable(mqList: string[]): Observable<MediaChange[]> {
        const hasChanges = (changes: MediaChange[]) => {
            const isValidQuery = (change: MediaChange) => (change.mediaQuery.length > 0);

            return (changes.filter(isValidQuery).length > 0);
        };
        const excludeOverlaps = (changes: MediaChange[]) => {
            return !this.filterOverlaps ? changes : changes.filter(change => {
                const bp = this._breakpoints.findByQuery(change.mediaQuery);

                return bp?.overlapping ?? true;
            });
        };
        const ignoreDuplicates = (previous: MediaChange[], current: MediaChange[]): boolean => {
            if (previous.length !== current.length) {
                return false;
            }

            const previousMqs = previous.map(mc => mc.mediaQuery);
            const currentMqs = new Set(current.map(mc => mc.mediaQuery));
            const difference = new Set(previousMqs.filter(mq => !currentMqs.has(mq)));

            return difference.size === 0;
        };

        /**
         */
        return this._matchMedia
            .observe(this._hook.withPrintQuery(mqList))
            .pipe(
                filter((change: MediaChange) => change.matches),
                debounceTime(0, asapScheduler),
                switchMap(_ => of(this._findAllActivations())),
                map(excludeOverlaps),
                filter(hasChanges),
                distinctUntilChanged(ignoreDuplicates),
                takeUntil(this.destroyed$)
            );
    }

    /**
     * Find all current activations and prepare single list of activations
     * sorted by descending priority.
     */
    private _findAllActivations(): MediaChange[] {
        const mergeMQAlias = (change: MediaChange) => {
            const bp: OptionalBreakpoint = this._breakpoints.findByQuery(change.mediaQuery);

            return Utils.mergeAlias(change, bp);
        };
        const replaceWithPrintAlias = (change: MediaChange) => {
            return this._hook.isPrintEvent(change) ? this._hook.updateEvent(change) : change;
        };

        return this._matchMedia
            .activations
            .map(query => new MediaChange(true, query))
            .map(replaceWithPrintAlias)
            .map(mergeMQAlias)
            .sort(Utils.sortDescendingPriority);
    }


    /**
     * Register all the mediaQueries registered in the BreakPointRegistry
     * This is needed so subscribers can be auto-notified of all standard, registered
     * mediaQuery activations
     */
    private _watchActivations() {
        const queries = this._breakpoints.items.map(bp => bp.mediaQuery);

        return this._buildObservable(queries);
    }

}

/**
 * Find associated breakpoint (if any)
 */
function toMediaQuery(query: string, locator: BreakPointRegistry): string | null {
    const bp = locator.findByAlias(query) ?? locator.findByQuery(query);

    return bp?.mediaQuery ?? null;
}

/**
 * Split each query string into separate query strings if two queries are provided as comma
 * separated.
 */
function splitQueries(queries: string[]): string[] {
    return queries.map((query: string) => query.split(","))
        .reduce((a1: string[], a2: string[]) => a1.concat(a2))
        .map(query => query.trim());
}
