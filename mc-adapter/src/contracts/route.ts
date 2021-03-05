import { Agent } from "@/models/agent";
import { Response } from "@/models/response";
import { AppState } from "@/models/app_state";

export interface Route<T extends Agent> {
    /**
     * Defines how the message should be handled. The payload is JSON parsed
     * value that came from the client.
     *
     * Whatever is returned by the route is stringified and send as a response,
     * unless `null` is returned. In that case no response is sent to client.
     */
    handle(
        state: AppState<T>,
        agentId: string,
        payload: any
    ): Promise<Response<any>>;
}
