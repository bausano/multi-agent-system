import { Experiment } from "@/contracts/experiment";
import { Vec3 } from "vec3";
import { Route } from "@/contracts/route";
import { Predator } from "@ppp/models/predator";
import { Response, Empty } from "@/models/response";
import { AppState } from "@/models/app_state";

export class PredatorPreyPursuit implements Experiment<Predator> {
    public name(): string {
        return "predator_prey_pursuit";
    }

    public getRouteOrErr(path: string): Route<Predator> {
        const route = routes[path];

        if (!route) {
            throw new Error(`Route '${path}' doesn't exist in ${this.name()}`);
        }

        return route;
    }
}

/**
 * Defines routing, the key of this object is the string key send in
 * a message body as "route":
 *
 * ```json
 * {
 *   "route": "...",
 *   "payload": { ... },
 * }
 * ```
 */
const routes: { [path: string]: Route<Predator> } = {
    new: { handle: createPredator },
    look: { handle: lookAt },
};

/**
 * Called by python module when it connects for the first time.
 * We create minecraft bot and wait for it to be successfully spawned.
 */
async function createPredator(
    state: AppState<Predator>,
    predatorId: string,
    { username }: { username: string }
): Promise<Response<{}>> {
    if (!username || typeof username !== "string") {
        throw new Error(`Invalid username ${username}`);
    }

    // this is a preliminary check and it doesn't guarantee that during the
    // next promise, another agent joins
    // we do this to avoid unnecessary work
    if (state.isFull()) {
        throw new Error("Server is full");
    }

    // creates a new predator by connecting to the minecraft server
    const predator = await Predator.spawn(state.config, username);

    // another check before we insert into app state
    // since no promise runs now, this is "safe"
    if (state.isFull()) {
        try {
            predator.close();
        } catch (err) {
            console.error(`Cannot close agent ${predatorId}:`, err);
        }
        throw new Error("Server is full");
    }

    state.insertAgent(predatorId, predator);

    return new Response({});
}

/**
 * Instruct the minecraft bot to look at given point. Since the bot is
 * configured to always walk forward, this results in change of direction.
 */
async function lookAt(
    state: AppState<Predator>,
    predatorId: string,
    { x, z }: { x?: number; z?: number }
): Promise<Response<Empty>> {
    if (!Number.isFinite(x) || Number.isFinite(z)) {
        throw new Error(`Invalid point coordinates for lookAt: ${x}, ${z}`);
    }

    const bot = state.getAgentOrErr(predatorId).bot;
    // +1 because the position is of the bot's legs, but we want it to keep
    // looking straight
    const y = bot.entity.position.y + 1;

    bot.lookAt(new Vec3(x, y, z));

    return Response.empty();
}
