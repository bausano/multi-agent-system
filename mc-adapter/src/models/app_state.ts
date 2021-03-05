import { Config } from "./config";
import { Agent } from "./agent";

export class AppState<T extends Agent> {
    /**
     * We maintain a list of connections that the app handles. One connection
     * corresponds to one agent.
     */
    private agents: { [id: string]: T } = {};

    /**
     * The app state contains data which lives for the whole app lifetime and
     * are useful for the endpoints.
     */
    constructor(public config: Config) {
        //
    }

    /**
     * Returns the agent with given id or errors.
     */
    public getAgentOrErr(agentId: string): T {
        const agent = this.getAgent(agentId);

        if (!agent) {
            throw new Error(`Agent ${agentId} does not exist`);
        }

        return agent;
    }

    public getAgent(agentId: string): T | undefined {
        return this.agents[agentId];
    }

    public removeAgent(agentId: string) {
        delete this.agents[agentId];
    }

    public isFull(): boolean {
        return Object.values(this.agents).length >= this.config.maxAgents;
    }

    public insertAgent(agentId: string, agent: T) {
        if (this.getAgent(agentId)) {
            throw new Error(`Agent ${agentId} already exists`);
        }
        this.agents[agentId] = agent;
    }
}
