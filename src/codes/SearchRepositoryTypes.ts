import { EventArgs } from "jzo-library";

export type SearchRepositoryTickEventArgs = EventArgs & {
    items: Array<string>
}
