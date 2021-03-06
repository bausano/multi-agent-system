export class Config {
    /**
     * Port to open the WS connection on.
     */
    public serverPort: number;

    /**
     * Maximum number of agents that can connect to the Minecraft server.
     */
    public maxAgents: number;

    /**
     * If the Minecraft server doesn't send us "spawn" event, confirming that
     * the bot is ready to do work, then we retry.
     */
    public waitForBotSpawnMs: number;

    /**
     * Sometimes connection to Minecraft server fails. We attempt a few retries
     * before failing.
     */
    public maxMcConnectionRetries: number;

    /**
     * Address on which we run Minecraft server that hosts the experiment.
     */
    public mcAddr: { host: string; port: number };

    /**
     * How often should the server send state observation to its clients.
     * The shorter the period, the faster will the learning be.
     */
    public sendStatePeriodMs: number;

    /**
     * App level configuration.
     *
     * @param env Key-value store from which to select environment variables,
     *              by default they are selected from process.env
     */
    constructor(env?: { [key: string]: string | undefined }) {
        env = env || process.env;

        this.serverPort = parseInt(env.PORT || "8999") || 8999;
        this.maxAgents = parseInt(env.MAX_AGENTS || "7") || 7;
        this.maxMcConnectionRetries =
            parseInt(env.MAX_MC_CONNECTION_RETRIES || "3") || 3;
        this.waitForBotSpawnMs =
            parseInt(env.WAIT_FOR_BOT_SPAWN_MS || "10000") || 10000;
        this.sendStatePeriodMs =
            parseInt(env.SEND_STATE_PERIOD_MS || "200") || 200;

        if (!env.MC_HOST || !parseInt(env.MC_PORT)) {
            throw new Error("MC_HOST and MC_PORT env vars are invalid.");
        }
        this.mcAddr = {
            host: env.MC_HOST,
            port: parseInt(env.MC_PORT),
        };
    }
}
