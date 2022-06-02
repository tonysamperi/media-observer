import {MediaObserverService, MediaChange, BreakpointAliases} from "../index";
//
import {fromEvent} from "rxjs";
import {debounceTime} from "rxjs/operators";

class Page {

    get screenWidth() {
        return window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;
    }

    private _bo: MediaObserverService = MediaObserverService.INSTANCE;
    private _customMedia: string = "screen and (min-width: 500px)";
    private _queryEl: HTMLElement = document.querySelector("[media]") as HTMLElement;
    private _xsMedia: string = "screen and (min-width: 0px) and (max-width: 599.98px)";

    constructor() {
        console.info("PAGE CONSTRUCTOR");
        this._write("Loading...");
        this._init();
        this._initDebug();
    }

    private _init(): void {
        this._bo.asObservable()
            .pipe(debounceTime(250))
            .subscribe(($event: MediaChange[]) => {
                console.info("GOT CHANGES", $event);
                console.info("TEST", {
                    gtxs: this._bo.isActive(BreakpointAliases["gt-xs"]),
                    gtxsWrong: this._bo.isActive("gt-xs"),
                    gtsm: this._bo.isActive("gt-sm"),
                    gtmd: this._bo.isActive("gt-md"),
                    ltmd: this._bo.isActive("lt-md"),
                    ltlg: this._bo.isActive("lt-lg")
                });
                this._write(`
                <p>Alias: ${$event[0].mqAlias}</p>
                <p>Screen size: ${this.screenWidth}</p>
                <p>isActive(BreakpointAliases.xs): ${this._bo.isActive(BreakpointAliases.xs)}</p>
                <p>isActive(${this._xsMedia}): ${this._bo.isActive(this._xsMedia)}</p>
                <p>isActive(${this._customMedia}): ${this._bo.isActive(this._customMedia)}</p>
                <p>isMatched(${this._customMedia}): ${this._bo.isMatched(this._customMedia)}</p>
            `);
            });
    }

    private _initDebug(): void {
        fromEvent(document.querySelector("button[debug]") as HTMLElement, "click")
            .pipe(debounceTime(100))
            .subscribe(() => {
                this._bo.isActive(this._customMedia);
                this._bo.isMatched(this._customMedia);
            });
    }

    private _write(content: string): void {
        this._queryEl.innerHTML = content;
    }
}

new Page();
