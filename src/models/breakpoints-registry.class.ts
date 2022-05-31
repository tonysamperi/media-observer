import {BreakPoint} from "./breakpoint.interface";
import {OptionalBreakpoint} from "./optional-breakpoint.type";
import {Utils} from "../shared/utils.class";

export class BreakPointRegistry {
    readonly items: BreakPoint[];

    /**
     * Memoized BreakPoint Lookups
     */
    private readonly findByMap = new Map<string, OptionalBreakpoint>();

    constructor(list: BreakPoint[]) {
        this.items = [...list].sort(Utils.sortAscendingPriority);
    }

    /**
     * Search breakpoints by alias (e.g. gt-xs)
     */
    findByAlias(alias: string): OptionalBreakpoint {
        return !alias ? null : this.findWithPredicate(alias, (bp) => bp.alias === alias);
    }

    findByQuery(query: string): OptionalBreakpoint {
        return this.findWithPredicate(query, (bp) => bp.mediaQuery === query);
    }

    /**
     * Get all the breakpoints whose ranges could overlapping `normal` ranges;
     * e.g. gt-sm overlaps md, lg, and xl
     */
    get overlappings(): BreakPoint[] {
        return this.items.filter(it => it.overlapping);
    }

    /**
     * Get list of all registered (non-empty) breakpoint aliases
     */
    get aliases(): string[] {
        return this.items.map(it => it.alias);
    }

    /**
     * Aliases are mapped to properties using suffixes
     * e.g.  'gt-sm' for property 'layout'  uses suffix 'GtSm'
     * for property layoutGtSM.
     */
    get suffixes(): string[] {
        return this.items.map(it => it?.suffix ?? "");
    }

    /**
     * Memoized lookup using custom predicate function
     */
    private findWithPredicate(key: string,
                              searchFn: (bp: BreakPoint) => boolean): OptionalBreakpoint {
        let response = this.findByMap.get(key);
        if (!response) {
            response = this.items.find(searchFn) ?? null;
            this.findByMap.set(key, response);
        }

        return response ?? null;

    }

}
