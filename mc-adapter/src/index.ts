import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { ClientMessage, ErrorMessage } from "./types/messages";
import { createNewConnection } from "./createNewConnection";
import { v4 as uuidv4 } from "uuid";
import { MAX_CONNECTIONS } from "./config";
import { Connection } from "./types/Connection";
import { handleMessage } from "./handleMessage";

const server = http.createServer(express());

// Abstraction over http server for WS.
const wss = new WebSocket.Server({ server });

const connections: { [uuid: string]: Connection } = {};

wss.on("connection", (ws: WebSocket) => {
    // Creates new id for each connection. This is can then be used to find the
    // connection state in the global connections dictionary.
    const connId = uuidv4();

    ws.on("message", async (rawMessage: string) => {
        try {
            // FIXME: Validation of the message.
            const message: ClientMessage = JSON.parse(rawMessage);

            try {
                await handleMessage(connections, connId, message);
            } catch (error) {
                const message: ErrorMessage = { error: error.message };
                ws.send(message);
            }
        } catch {
            const message: ErrorMessage = { error: "Invalid JSON." };
            ws.send(message);
        }
    });

    // If the connection was closed, disconnect from the MC server and remove
    // the data from the global object.
    ws.on("close", () => {
        try {
            connections[connId].close();
        } finally {
            delete connections[connId];
        }
    });

    ws.send("connected");
});

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Minecraft adapter started on ${server.address()}.`);
});
