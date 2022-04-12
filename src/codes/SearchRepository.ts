import { EventArgs, GenericEvent } from "jzo-library";
import { SearchResponse } from "./SearchApiTypes";
import { SearchRepositoryTickEventArgs } from "./SearchRepositoryTypes";

const defaultItems: Array<string> = ['A', 'B', 'C', 'D', 'E'];

// process the current search result and rotating the list
export default class SearchRepository {

    private _currentItems: Array<string> = [...defaultItems];
    private _itemsToLoad: Array<string> = [];
    private _eventTick: GenericEvent<SearchRepositoryTickEventArgs> = new GenericEvent<SearchRepositoryTickEventArgs>();
    private _tickTimeoutId: number = -1;

    get eventTick() { return this._eventTick; }

    getCurrentItems = (): Array<string> => {
        return [...this._currentItems];
    }

    start = (): void => {
        this._tickTimeoutId = setTimeout(this.processNextTick, 1000) as unknown as number;
    }

    stop = (): void => {
        clearTimeout(this._tickTimeoutId);
    }

    applySearchResult = (searchResult: SearchResponse): void => {
        this._itemsToLoad = searchResult.results;
        this._currentItems = [...defaultItems];
        clearTimeout(this._tickTimeoutId);
        this.raiseTickEvent();
        this.start();
    }

    private processNextTick = () => {
        const deleted: Array<string> = this._currentItems.splice(0, 1);
        if (this._itemsToLoad.length > 0) {
            this._currentItems.push(this._itemsToLoad[0]);
            this._itemsToLoad.splice(0, 1);
        } else {
            this._currentItems.push(deleted[0]);
        }
        this.raiseTickEvent();
        this.start();
    }

    private raiseTickEvent = (): void => {
        const ev: SearchRepositoryTickEventArgs = (new EventArgs()) as SearchRepositoryTickEventArgs;
        ev.items = [...this._currentItems];
        this._eventTick.raiseEvent(this, ev);
    }

}