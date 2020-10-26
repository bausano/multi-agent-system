import { MAX_CONNECTIONS } from "./config";
import { createNewConnection } from "./createNewConnection";
import { errorMsg, okMsg } from "./helpers";
import { Connection } from "./types/Connection";
import { ClientMessage, ServerMessage } from "./types/messages";

/**
 * Routes the messages according to the protocol layed out in the README.md.
 *
 * @param connections Dictionary of existing connections
 * @param connId Id of the connection which sent the message
 * @param message The message we received
 */
export async function handleMessage(
    connections: { [uuid: string]: Connection },
    connId: string,
    message: ClientMessage
): Promise<ServerMessage> {
    if (message.init) {
        const { host, port, username, behavior } = message.init;
        // Counts number of players connected to a server via this adapter.
        // This allows a single adapter runtime work for multiple MC servers.
        const connectionsAtServer = Object.values(connections).filter(
            (conn) => conn.host === host && conn.port === port
        ).length;

        if (connectionsAtServer >= MAX_CONNECTIONS) {
            throw new Error("Server is full.");
        }

        connections[connId] = await createNewConnection(
            host,
            port,
            username,
            behavior
        );

        return okMsg();
    }

    return errorMsg("Unsupported operation.");
}
