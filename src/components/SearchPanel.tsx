import "./SearchPanel.css"

import React from "react";
import SearchRepository from "../codes/SearchRepository";
import { SearchRepositoryTickEventArgs } from "../codes/SearchRepositoryTypes";
import { AppConfiguration } from "../codes/AppConfiguration";
import SearchApi from "../codes/SearchApi";
import { SearchResponse } from "../codes/SearchApiTypes";

import ErrorImg from "../assets/neil-patrick-harris-gun-mouth.gif";

type SearchPanelState = {
    isSearchFieldDisabled: boolean,
    items: Array<string>,
    textToFind: string,
    hasError: boolean
}

class SearchPanel extends React.Component<{}, SearchPanelState> {

    private _searchInputRef: React.RefObject<HTMLInputElement> = React.createRef<HTMLInputElement>();
    private _searchApi: SearchApi = new SearchApi();
    private _repository: SearchRepository = new SearchRepository();
    private _textToFindTimeoutId: number = -1;

    constructor(props: any) {
        super(props);
        this.state = {
            isSearchFieldDisabled: false,
            items: this._repository.getCurrentItems(),
            textToFind: "",
            hasError: false
        };
    }

    get searchInput() { return this._searchInputRef.current; }

    componentDidMount() {
        this._repository.eventTick.addEventHandler(this.searchRepositoryTickEventHandler);
        this._repository.start();
    }

    componentWillUnmount() {
        this.stopQueryInQueueIfExists();
        this._repository.eventTick.removeEventHandler(this.searchRepositoryTickEventHandler);
        this._repository.stop();
        this._searchApi.dispose();
    }

    private searchRepositoryTickEventHandler = (sender: object, data: SearchRepositoryTickEventArgs) => {
        this.setState({ items: data.items });
    }

    private onTextChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        const textToFind: string = e.target.value.trim();
        if (textToFind.length > 0) {
            this.stopQueryInQueueIfExists();
            if (textToFind.length >= AppConfiguration.searchTextTypingStartQueryMinTextLength) {
                this._textToFindTimeoutId = setTimeout(() => {
                    this.setState({ isSearchFieldDisabled: true });
                    this._searchApi.performSearch({ textToFind: this.state.textToFind })
                        .then((result: SearchResponse) => {
                            this._repository.applySearchResult(result);
                            this.setState({ isSearchFieldDisabled: false, hasError: false }, () => this.searchInput?.focus());
                        })
                        .catch((error: any) => {
                            // need to improve error handling. Message popup, or text, etc...
                            console.log(error);
                            this.setState({ isSearchFieldDisabled: true, hasError: true }, () => this.searchInput?.focus());
                        });
                }, AppConfiguration.searchTextTypingStartQueryDelayInMS) as unknown as number;
            }
        }
        this.setState({ textToFind: textToFind });
    }

    private stopQueryInQueueIfExists = (): void => {
        if (this._textToFindTimeoutId !== -1) {
            clearTimeout(this._textToFindTimeoutId);
            this._textToFindTimeoutId = -1;
        }
    }

    render(): React.ReactNode {
        return (
            <div className={this.state.hasError ? "sp-main-error-layout" : "sp-main-layout"}>
                <input ref={this._searchInputRef} className="sp-input" type="search" minLength={3} placeholder="Search Band" disabled={this.state.isSearchFieldDisabled} defaultValue={this.state.textToFind} onChange={this.onTextChanged} />
                <div></div>
                {
                    this.state.hasError ?
                        <div className="sp-error-layout">
                            <div className="sp-centered-text">Query failed :(</div>
                            <div></div>
                            <div style={{ overflow: 'auto' }}>
                                <img src={ErrorImg} alt="Query failed, sorry :(" style={{ width: '100%', maxWidth: '100%' }} />
                            </div>
                            <div></div>
                            <div className="sp-centered-text">Handle it with humour :)</div>
                        </div>
                        :
                        <div className="sp-result-layout">
                            <div className="sp-result-item">{this.state.items[0]}</div>
                            <div></div>
                            <div className="sp-result-item">{this.state.items[1]}</div>
                            <div></div>
                            <div className="sp-result-item">{this.state.items[2]}</div>
                            <div></div>
                            <div className="sp-result-item">{this.state.items[3]}</div>
                            <div></div>
                            <div className="sp-result-item">{this.state.items[4]}</div>
                        </div>
                }
            </div>
        );
    }

}

export default SearchPanel;
