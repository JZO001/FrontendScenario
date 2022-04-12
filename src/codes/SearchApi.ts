import axios, { AxiosResponse } from "axios";
import { Dictionary } from "jzo-library";
import { AppConfiguration } from "./AppConfiguration";
import { SearchItunesData, SearchiTunesDataItem, SearchRequest, SearchResponse } from "./SearchApiTypes";
import { Urls } from "./Urls";

// handles search request to 3rd party service and process the response
export default class SearchApi {

    // stores the cached search results, which were previously searched successfully
    private _searchCache: Dictionary<string, SearchResponse> = new Dictionary<string, SearchResponse>();

    // stores the search result with a timeout identifier, which will free up memory as a resource after a period of time
    private _searchCacheClearTimeout: Dictionary<string, number> = new Dictionary<string, number>();

    performSearch = (request: SearchRequest): Promise<SearchResponse> => {
        return new Promise<SearchResponse>((resolve, reject) => {
            if (this._searchCacheClearTimeout.containsKey(request.textToFind)) {
                // cache hit, reset timeout
                clearTimeout(this._searchCacheClearTimeout.get(request.textToFind));
                this._searchCacheClearTimeout.remove(request.textToFind);
                this.startSearchCacheCleanupSnapCount(request.textToFind);
                resolve(this._searchCache.get(request.textToFind));
            } else {
                axios.get(Urls.SEARCH_API_URL + request.textToFind)
                    .then((response: AxiosResponse<SearchItunesData>) => {
                        if (response.status === 200) {
                            // collect names
                            const data: SearchItunesData = response.data;
                            const collectorDict: Dictionary<string, string> = new Dictionary<string, string>();
                            data.results.forEach((item: SearchiTunesDataItem) => {
                                if (item.collectionName && item.collectionName !== null && item.collectionName.length > 0)
                                    if (!collectorDict.containsKey(item.collectionName)) {
                                        collectorDict.add(item.collectionName, "");
                                    }
                            });

                            const searchResult: SearchResponse = { results: [] };

                            // sort & process
                            const sortedArray: Array<string> = collectorDict.keys.sort();
                            let index: number = 0;
                            while (index < AppConfiguration.searchItemMaxResultSetSize && index < sortedArray.length) {
                                searchResult.results.push(sortedArray[index]);
                                index++;
                            }

                            // store into the cache
                            this._searchCache.add(request.textToFind, searchResult);

                            // init cleanup snapcount
                            this.startSearchCacheCleanupSnapCount(request.textToFind);

                            // cleanup memory
                            collectorDict.clear();

                            // callback with result
                            resolve(searchResult);
                        } else {
                            reject(response);
                        }
                    })
                    .catch((error: any) => reject(error));
            }
        });
    }

    dispose = (): void => {
        if (this._searchCacheClearTimeout.count > 0) {
            this._searchCacheClearTimeout.values.forEach((id: number) => clearTimeout(id));
            this._searchCacheClearTimeout.clear();
        }
    }

    private startSearchCacheCleanupSnapCount = (key: string): void => {
        const result: number = setTimeout(() => {
            this._searchCacheClearTimeout.remove(key);
            this._searchCache.remove(key);
        }, AppConfiguration.searchItemFreeUpTimeoutInMS) as unknown as number;
        this._searchCacheClearTimeout.add(key, result);
    }

}
