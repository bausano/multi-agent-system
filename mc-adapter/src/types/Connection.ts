import { Bot } from "mineflayer";

export class Connection {
    constructor(public bot: Bot, public host: string, public port: number) {
        //
    }

    public close() {
        this.bot.quit();
    }
}
