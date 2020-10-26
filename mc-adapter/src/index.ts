import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { ClientMessage, ServerMessage } from "./types/messages";
import { v4 as uuidv4 } from "uuid";
import { Connection } from "./types/Connection";
import { handleMessage } from "./handleMessage";
import { errorMsg, okMsg } from "./helpers";
import { STATE_UPDATE_INTERVAL_MS } from "./config";
import { collectState } from "./collectState";

const server = http.createServer(express());

// Abstraction over http server for WS.
const wss = new WebSocket.Server({ server });

// The global state with active connections.
const connections: { [uuid: string]: Connection } = {};

wss.on("connection", (ws: WebSocket) => {
    // Creates new id for each connection. This is can then be used to find the
    // connection state in the global connections dictionary.
    const connId = uuidv4();

    ws.on("message", async (rawMessage: string) => {
        console.log(`New message from connection ${connId}.`);
        try {
            // FIXME: Validation of the message.
            const message: ClientMessage = JSON.parse(rawMessage);

            try {
                sendToClient(
                    ws,
                    await handleMessage(connections, connId, message)
                );
            } catch (error) {
                sendToClient(ws, errorMsg(error.message));
            }
        } catch {
            sendToClient(ws, errorMsg("Invalid JSON."));
        }
    });

    // The interval which collects state and sends it to the client. Alternative
    // would be to keep one timer and always iterate through all connections.
    const stateUpdateInterval = setInterval(async () => {
        try {
            const conn = connections[connId]
            if (conn) {
                sendToClient(ws, await collectState(conn));
            }
        } catch (error) {
            console.log(`Cannot collect state for ${connId} due to`, error);
        }
    }, STATE_UPDATE_INTERVAL_MS);

    // If the connection was closed, disconnect from the MC server and remove
    // the data from the global object.
    ws.on("close", () => {
        console.log(`Connection ${connId} has been closed.`);

        clearInterval(stateUpdateInterval);
        if (connections[connId]) {
            try {
                connections[connId].close();
            } finally {
                delete connections[connId];
            }
        }
    });

    sendToClient(ws, okMsg());
});

server.listen(process.env.PORT || 8999, () => {
    console.log(
        `Minecraft adapter started on ${JSON.stringify(server.address())}.`
    );
});

function sendToClient(ws: WebSocket, message: ServerMessage) {
    ws.send(JSON.stringify(message));
}
