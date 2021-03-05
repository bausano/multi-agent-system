import { Agent } from "@/models/agent";
import { Route } from "@/contracts/route";
import { Event } from "./event";

export interface Experiment<T extends Agent> {
    /**
     * Experiment identifier.
     */
    name(): string;

    /**
     * It's paramount that this method is cheap to call. It will be called
     * every time a new message is received.
     */
    getRouteOrErr(path: string): Route<T>;

    /**
     * List of periodically executed events.
     */
    events(): Event<T>[];
}
