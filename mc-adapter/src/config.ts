import { config } from "dotenv";

// Loads the environment variables.
config();

// How many players can we have at most.
export const MAX_CONNECTIONS = process.env.MAX_CONNECTIONS || 7;
