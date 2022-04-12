export type SearchRequest = {
    textToFind: string
}

export type SearchResponse = {
    results: Array<string>
}

export type SearchItunesData = {
    results: Array<SearchiTunesDataItem>
}

export type SearchiTunesDataItem = {
    collectionName: string
}
