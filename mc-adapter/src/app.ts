import * as WebSocket from "ws";
import { AppState } from "@/models/app_state";
import { Config } from "@/models/config";
import { Agent } from "@/models/agent";
import { Response } from "@/models/response";
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

            conn.on("message", async (rawMessage: string) =>
                this.handleMessage(conn, connId, rawMessage).catch((err) =>
                    this.sendErr(conn, err)
                )
            );

            const events = this.startEvents(conn, connId);
            conn.on("close", () => this.closeConn(connId, events));

            // acknowledges the client
            this.sendOk(conn, new Response("ready"));
        });
    }

    /**
     * Events are functions executed periodically.
     */
    private startEvents(conn: WebSocket, connId: string): NodeJS.Timeout[] {
        return this.experiment.events().map((event) =>
            setInterval(() => {
                event
                    .run(this.appState, connId)
                    .then((response) => this.sendOk(conn, response))
                    .catch((err) =>
                        console.error(
                            `Error in event ${event.name} (connection ${connId}):`,
                            err
                        )
                    );
            }, event.periodMs)
        );
    }

    /**
     * Handles incoming message by
     * 1. parsing it (assumes JSON valid)
     * 2. forwarding it to experiment's route
     * 3. returning the JSON stringified response body
     */
    private async handleMessage(
        conn: WebSocket,
        connId: string,
        rawMessage: string
    ) {
        const serverMessage = JSON.parse(rawMessage);

        if (!serverMessage.route || !serverMessage.payload) {
            throw new Error(`Received an invalid message: '${rawMessage}'`);
        }

        const routePath: string = String(serverMessage.route);
        const payload: any = serverMessage.payload;

        console.log(`Received message from ${connId} on route '${routePath}'`);
        const route = this.experiment.getRouteOrErr(routePath);
        const response = await route.handle(this.appState, connId, payload);

        this.sendOk(conn, response);
    }

    /**
     * Closes agent's connection and removes it from app state.
     */
    private async closeConn(connId: string, intervals: NodeJS.Timeout[]) {
        intervals.map(clearInterval);

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
    private sendOk(conn: WebSocket, response: Response<any>) {
        // if empty (null), then don't send any message
        if (response.body === null) {
            return;
        }

        conn.send(JSON.stringify({ status: "ok", body: response.body }));
    }

    /**
     * Sends error message to the client.
     */
    private sendErr(conn: WebSocket, err: Error) {
        const message = `${err.name}: ${err.message}`;
        console.log(`Sending following error to the client:`, message);

        conn.send(
            JSON.stringify({
                status: "err",
                message,
            })
        );
    }
}
