import {MediaChange} from "../models/media-change.class";
import {Utils} from "../shared/utils.class";
//
import {BehaviorSubject, Observable, Observer, merge} from "rxjs";
import {filter} from "rxjs/operators";


export class MatchMediaService {

    static get INSTANCE(): MatchMediaService {
        return this._INSTANCE || new MatchMediaService();
    }

    private static _INSTANCE?: MatchMediaService;

    /**
     * Publish list of all current activations
     */
    get activations(): string[] {
        const results: string[] = [];
        this.registry.forEach((mql: MediaQueryList, key: string) => {
            if (mql.matches) {
                results.push(key);
            }
        });

        return results;
    }

    registry = new Map<string, MediaQueryList>();
    readonly source = new BehaviorSubject<MediaChange>(new MediaChange(true));

    protected _observable$ = this.source.asObservable();

    private readonly _pendingRemoveListenerFns: Array<() => void> = [];

    protected constructor() {
    }

    destroy(): void {
        let fn;
        // tslint:disable-next-line:no-conditional-assignment
        while (fn = this._pendingRemoveListenerFns.pop()) {
            fn();
        }
        MatchMediaService._INSTANCE = void 0;
    }

    /**
     * For the specified mediaQuery?
     */
    isActive(mediaQuery: string): boolean {
        const mql = this.registry.get(mediaQuery);

        return mql?.matches ?? this.registerQuery(mediaQuery).some(m => m.matches);
    }

    /**
     * External observers can watch for all (or a specific) mql changes.
     *
     * If a mediaQuery is not specified, then ALL mediaQuery activations will
     * be announced.
     */
    observe(): Observable<MediaChange>;
    // tslint:disable-next-line:unified-signatures
    observe(mediaQueries: string[]): Observable<MediaChange>;
    // tslint:disable-next-line:unified-signatures
    observe(mediaQueries: string[], filterOthers: boolean): Observable<MediaChange>;

    /**
     * External observers can watch for all (or a specific) mql changes.
     * Typically used by the MediaQueryAdaptor; optionally available to components
     * who wish to use the MediaMonitor as mediaMonitor$ observable service.
     *
     * Use deferred registration process to register breakpoints only on subscription
     * This logic also enforces logic to register all mediaQueries BEFORE notify
     * subscribers of notifications.
     */
    observe(mqList?: string[], filterOthers = false): Observable<MediaChange> {
        if (mqList && mqList.length) {
            const matchMedia$: Observable<MediaChange> = this._observable$.pipe(
                filter((change: MediaChange) =>
                    !filterOthers ? true : (mqList.indexOf(change.mediaQuery) > -1))
            );
            const registration$: Observable<MediaChange> = new Observable((observer: Observer<MediaChange>) => {  // tslint:disable-line:max-line-length
                const matches: Array<MediaChange> = this.registerQuery(mqList);
                if (matches.length) {
                    const lastChange = matches.pop()!;
                    matches.forEach((e: MediaChange) => {
                        observer.next(e);
                    });
                    this.source.next(lastChange); // last match is cached
                }
                observer.complete();
            });

            return merge(registration$, matchMedia$);
        }

        return this._observable$;
    }

    /**
     * Based on the BreakPointRegistry provider, register internal listeners for each unique
     * mediaQuery. Each listener emits specific MediaChange data to observers
     */
    registerQuery(mediaQuery: string | string[]) {
        const list = Array.isArray(mediaQuery) ? mediaQuery : [mediaQuery];
        const matches: MediaChange[] = [];

        // buildQueryCss(list, this._document);

        list.forEach((query: string) => {
            const onMQLEvent = (e: MediaQueryListEvent) => {
                this.source.next(new MediaChange(e.matches, query));
            };

            let mql = this.registry.get(query);
            if (!mql) {
                mql = this.buildMQL(query);
                mql.addEventListener("change", onMQLEvent);
                this._pendingRemoveListenerFns.push(() => mql!.removeEventListener("change", onMQLEvent));
                this.registry.set(query, mql);
            }

            if (mql.matches) {
                matches.push(new MediaChange(true, query));
            }
        });

        return matches;
    }

    /**
     * Call window.matchMedia() to build a MediaQueryList; which
     * supports 0..n listeners for activation/deactivation
     */
    protected buildMQL(query: string): MediaQueryList {
        return Utils.constructMql(query);
    }

}
