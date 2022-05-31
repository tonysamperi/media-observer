import {WithPriority} from "../models/with-priority.interface";
import {MediaChange} from "../models/media-change.class";
import {BreakPoint} from "../models/breakpoint.interface";

export class Utils {

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
}
