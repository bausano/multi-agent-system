import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { Config } from "@/models/config";

/**
 * Constructs ws server handles.
 */
export function createWsServer(config: Config): WebSocket.Server {
    const server = http.createServer(express());
    server.listen(config.serverPort, () => {
        console.log(
            `Minecraft adapter started on ${JSON.stringify(server.address())}.`
        );
    });

    return new WebSocket.Server({ server });
}
