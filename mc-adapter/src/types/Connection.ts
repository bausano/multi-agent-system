import { Bot } from "mineflayer";

export class Connection {
    /**
     * Accumulates rewards for killed prey in proximity. When this reward is
     * sent to the client over WS, it gets set back to 0.
     */
    private rewardSinceLastUpdate: number = 0;

    constructor(public bot: Bot, public host: string, public port: number) {
        //
    }

    public close() {
        this.bot.quit();
    }

    /**
     * We reward bots based on how far away they are from a prey kill.
     */
    public preyDiedInProximity(preyX: number, preyZ: number) {
        const { x: botX, z: botZ } = this.bot.entity.position;
        const sqDist = Math.pow(preyX - botX, 2) + Math.pow(preyZ - botZ, 2);

        if (sqDist < 9) {
            this.rewardSinceLastUpdate += 3;
        } else if (sqDist < 16) {
            this.rewardSinceLastUpdate += 2;
        } else if (sqDist < 25) {
            this.rewardSinceLastUpdate += 1;
        }
    }

    public getRewardSinceLastUpdateAndReset(): number {
        const reward = this.rewardSinceLastUpdate;
        this.rewardSinceLastUpdate = 0;
        return reward;
    }
}
