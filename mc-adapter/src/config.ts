import { config } from "dotenv";

// Loads the environment variables.
config();

// How many players can we have at most.
export const MAX_CONNECTIONS = process.env.MAX_CONNECTIONS || 7;

// How often should we send update to the client.
export const STATE_UPDATE_INTERVAL_MS =
    parseInt(process.env.STATE_UPDATE_INTERVAL_MS) || 500;
