import {BreakpointAliases} from "../models/breakpoint-aliases.enum";
import {WithPriority} from "../models/with-priority.interface";
import {MediaChange} from "../models/media-change.class";
import {BreakPoint} from "../models/breakpoint.interface";

export class Utils {

    private static _maxPriority: number = 1000;

    /**
     * Builds the array of breakpoints starting with a simple map of base breakpoints
     * @param breakpoints: [alias, mediaQuery]
     */
    static buildBreakpoints(breakpoints: [BreakpointAliases | string, string][]): BreakPoint[] {
        const breakpointAliases = {
            base: breakpoints.map(([a]) => a),
            lt: breakpoints.slice(1).map(([a]) => `lt-${a}`),
            gt: breakpoints.slice(0, -1).map(([a]) => `gt-${a}`)
        };
        const queryMap: Record<string, string> = breakpoints.reduce((acc, [alias, width], index) => {
            const minWidthValue = index > 0 ? breakpoints[index - 1][1] : 0;
            const minWidth = `(min-width: ${minWidthValue})`;
            const maxWidth = this._getAliasMaxWidth(width);
            acc[alias] = `screen and ${minWidth} and ${maxWidth}`;
            if (index > 0) {
                acc[`lt-${alias}`] = `screen and (max-width: ${minWidthValue})`;
            }
            if (index < breakpoints.length - 1) {
                acc[`gt-${alias}`] = `screen and (min-width: ${width})`;
            }

            return acc;
        }, {} as Record<string, string>);

        return [
            ...breakpointAliases.base.map((alias, index) => {
                return {
                    alias,
                    mediaQuery: queryMap[alias],
                    priority: this._maxPriority - 100 * index
                } as BreakPoint;
            }),
            ...breakpointAliases.lt.map((alias, index) => {
                return {
                    alias,
                    overlapping: !0,
                    mediaQuery: queryMap[alias],
                    priority: (this._maxPriority - 50) - 100 * index
                } as BreakPoint;
            }),
            ...breakpointAliases.gt.map((alias, index) => {
                return {
                    alias,
                    overlapping: !0,
                    mediaQuery: queryMap[alias],
                    priority: -1 * (this._maxPriority - 50) + 100 * index
                } as BreakPoint;
            })
        ];
    }

    /** Wraps the provided value in an array, unless the provided value is an array. */
    static coerceArray<T>(value: T | T[]): T[] {
        return Array.isArray(value) ? value : [value];
    }

    static constructMql(query: string): MediaQueryList {
        const canListen = this.isPlatformBrowser() && !!(window as Window).matchMedia("all").addEventListener;

        return canListen ? (window as Window).matchMedia(query) : {
            matches: query === "all" || query === "",
            media: query,
            addListener: () => {
            },
            removeListener: () => {
            },
            onchange: null,
            addEventListener() {
            },
            removeEventListener() {
            },
            dispatchEvent() {
                return false;
            }
        } as MediaQueryList;
    }

    /**
     * Returns whether running in a browser platform.
     * @publicApi
     */
    static isPlatformBrowser(): boolean {
        return typeof window !== "undefined" && typeof window.document !== "undefined";
    }

    /**
     * For the specified MediaChange, make sure it contains the breakpoint alias
     * and suffix (if available).
     */
    static mergeAlias(dest: MediaChange, source: BreakPoint | null): MediaChange {
        dest = dest ? dest.clone() : new MediaChange();
        if (source) {
            dest.mqAlias = source.alias;
            dest.mediaQuery = source.mediaQuery;
            dest.suffix = source.suffix as string;
            dest.priority = source.priority as number;
        }

        return dest;
    }

    /** HOF to sort the breakpoints by ascending priority */
    static sortAscendingPriority<T extends WithPriority>(a: T, b: T): number {
        const pA = a.priority || 0;
        const pB = b.priority || 0;

        return pA - pB;
    }

    /** HOF to sort the breakpoints by descending priority */
    static sortDescendingPriority<T extends WithPriority>(a: T | null, b: T | null): number {
        const priorityA = a ? a.priority || 0 : 0;
        const priorityB = b ? b.priority || 0 : 0;

        return priorityB - priorityA;
    }

    private static _getAliasMaxWidth(width: string) {
        const value = parseFloat(width.replace(/[A-Za-z]/g, ""));
        const unit = width.replace(`${value}`, "");

        return `(max-width: ${value - 0.02}${unit})`;
    }
}
