import {MediaObserverService, MediaChange} from "../index";
import {debounceTime} from "rxjs/operators";

class Page {
    private _bo: MediaObserverService = MediaObserverService.INSTANCE;
    private _queryEl: HTMLElement = document.querySelector("[media]") as HTMLElement;

    constructor() {
        console.info("PAGE CONSTRUCTOR");
        this._bo.asObservable()
            .pipe(debounceTime(250))
            .subscribe(($event: MediaChange[]) => {
            console.info("GOT CHANGES", $event);
            console.info("TEST", {
                gtxs: this._bo.isActive("gtxs"),
                "gt-xs": this._bo.isActive("gt-xs"),
                gtsm: this._bo.isActive("gt-sm"),
                gtmd: this._bo.isActive("gt-md"),
                ltmd: this._bo.isActive("lt-md"),
                ltlg: this._bo.isActive("lt-ltlg"),
            });
            this._write($event[0].mqAlias);
        });
        this._write("Loading...");
    }

    private _write(content: string): void {
        this._queryEl.innerHTML = content;
    }
}

new Page();
