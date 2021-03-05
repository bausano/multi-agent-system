import * as WebSocket from "ws";
import { AppState } from "@/models/app_state";
import { Config } from "@/models/config";
import { Agent } from "@/models/agent";
import { Empty } from "@/models/response";
import { Experiment } from "@/contracts/experiment";
import { v4 as uuidv4 } from "uuid";

export class App<T extends Agent> {
    /**
     * Holds app information which can be consumed by the routes.
     */
    private appState: AppState<T>;

    /**
     * Creates a new app on given websocket server and with given experiment
     * routes handler. The second parameter is what determines which logic
     * is used to handle messages.
     */
    constructor(
        ws: WebSocket.Server,
        config: Config,
        private experiment: Experiment<T>
    ) {
        this.appState = new AppState(config);

        ws.on("connection", async (conn: WebSocket) => {
            // Each new connection is assigned a random id. This id is
            // persisted in the app state. It's used to identify from which
            // agent a message came.
            const connId = uuidv4();

            ws.on("message", async (rawMessage: string) =>
                this.handleMessage(connId, rawMessage)
                    .then((response) => this.sendToClient(conn, response))
                    .catch((err) => console.error("TODO: err", err))
            );

            ws.on("close", () => this.closeConn(connId));
        });
    }

    /**
     * Handles incoming message by
     * 1. parsing it (assumes JSON valid)
     * 2. forwarding it to experiment's route
     * 3. returning the JSON stringified response body
     */
    private async handleMessage(
        connId: string,
        rawMessage: string
    ): Promise<string | Empty> {
        const serverMessage = JSON.parse(rawMessage);

        if (!serverMessage.route || !serverMessage.payload) {
            throw new Error(`Received an invalid message: '${rawMessage}'`);
        }

        const routePath: string = String(serverMessage.route);
        const payload: any = serverMessage.payload;

        const route = this.experiment.getRouteOrErr(routePath);
        const response = await route.handle(this.appState, connId, payload);
        return response.getBody();
    }

    /**
     * Closes agent's connection and removes it from app state.
     */
    private async closeConn(connId: string) {
        const agent = this.appState.getAgent(connId);
        if (!agent) {
            console.warn(
                `Cannot close connection ${connId}: agent doesn't exist`
            );
        } else {
            agent.close();
            this.appState.removeAgent(connId);
        }
    }

    /**
     * Sends the response to the client over websocket, unless the body is
     * empty, then it's a no-op.
     */
    private async sendToClient(conn: WebSocket, body: string | Empty) {
        // if empty (null), then don't send any message
        if (body === null) {
            return;
        }

        conn.send(body);
    }
}
