import { Agent } from "@/models/agent";
import { AppState } from "@/models/app_state";
import { Response } from "@/models/response";

export interface Event<T extends Agent> {
    /**
     * How often should the event be executed.
     */
    periodMs: number;

    /**
     * Runs the event logic.
     */
    run(state: AppState<T>, agentId: string): Promise<Response<any>>;
}
