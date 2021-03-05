import { Experiment } from "@/contracts/experiment";
import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import { Route } from "@/contracts/route";
import { Predator } from "@ppp/models/predator";
import { Response, Empty } from "@/models/response";
import { AppState } from "@/models/app_state";
import { Event } from "@/contracts/event";
import { Config } from "@/models/config";
import { Umwelt } from "./contracts/umwelt";
import { hashString } from "@/misc";

export class PredatorPreyPursuit implements Experiment<Predator> {
    constructor(private config: Config) {
        //
    }

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

    public events(): Event<Predator>[] {
        return [
            {
                periodMs: this.config.sendStatePeriodMs,
                run: sendState,
            },
        ];
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
    init: { handle: createPredator },
    look: { handle: lookAt },
};

/**
 * Called by python module when it connects for the first time.
 * We create minecraft bot and wait for it to be successfully spawned.
 */
async function createPredator(
    state: AppState<Predator>,
    predatorId: string,
    {
        username,
        nearestEntitiesToSend,
    }: { username?: string; nearestEntitiesToSend?: number }
): Promise<Response<{}>> {
    if (!username || typeof username !== "string") {
        throw new Error(`Invalid username ${username}`);
    }

    if (!nearestEntitiesToSend || Number.isFinite(nearestEntitiesToSend)) {
        throw new Error(
            `Invalid number of nearest entities to send '${nearestEntitiesToSend}'`
        );
    }

    // this is a preliminary check and it doesn't guarantee that during the
    // next promise, another agent joins
    // we do this to avoid unnecessary work
    if (state.isFull()) {
        throw new Error("Server is full");
    }

    // creates a new predator by connecting to the minecraft server
    const predator = await Predator.spawn(
        state.config,
        username,
        nearestEntitiesToSend
    );

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
 * configured to always walk forward, this results in the change of direction.
 */
async function lookAt(
    state: AppState<Predator>,
    predatorId: string,
    { x, z }: { x?: number; z?: number }
): Promise<Response<Empty>> {
    if (!Number.isFinite(x) || !Number.isFinite(z)) {
        throw new Error(`Invalid point coordinates for lookAt: ${x}, ${z}`);
    }

    const bot = state.getAgentOrErr(predatorId).bot;

    // +1 because the position is of the bot's legs, but we want it to keep
    // looking straight
    const y = bot.entity.position.y + 1;
    bot.lookAt(new Vec3(x, y, z));

    return Response.empty();
}

async function sendState(
    state: AppState<Predator>,
    predatorId: string
): Promise<Response<Umwelt>> {
    // Id of the fence block.
    const WALL_BLOCK = 191;

    const predator = state.getAgentOrErr(predatorId);
    const bot = predator.bot;

    // gets nearby entities and sorts them by distance
    const allNearbyEntities = Object.values(bot.entities).map((entity) => {
        return {
            entity,
            sqDist: bot.entity.position.distanceSquared(entity.position),
        };
    });
    allNearbyEntities.sort((a, b) => a.sqDist - b.sqDist);

    // filters out invalid entities and selects only limited number of them
    // as decided by the agent who called "createPredator" route
    const nearbyEntities = allNearbyEntities
        .filter(({ entity }) => entity.username || entity.name)
        .slice(0, predator.nearestEntitiesToSend)
        .map(({ sqDist, entity }) => {
            // Puts entity information into a list of numbers. Maybe it'd be
            // better if we published this data in a structured way and then
            // used it as list of numbers in the python code base, but this
            // saves some effort.
            // TBD: Consider also calculating distance to some set position
            // such as (0, 0).
            // We only export x and z coordinate because we assume that the
            // distance to bedrock is constant.
            return [
                hashString(entity.username || entity.name),
                sqDist,
                entity.position.x,
                entity.position.z,
                entity.velocity.x,
                entity.velocity.z,
                entity.health || 20,
            ];
        });

    // Returns fences in 3x3 area around bot into a 9D vector.
    function wallsAround(bot: Bot): number[] {
        const walls = [];
        const pos = bot.entity.position.clone().subtract(new Vec3(1, 0, 1));
        for (let z = 0; z < 3; z++) {
            for (let x = 0; x < 3; x++) {
                if ((bot as any).world.getBlockType(pos) === WALL_BLOCK) {
                    walls.push(1);
                } else {
                    walls.push(0);
                }
                pos.add(new Vec3(1, 0, 0));
            }
            pos.subtract(new Vec3(3, 0, 0));
            pos.add(new Vec3(0, 0, 1));
        }
        return walls;
    }

    return new Response({
        walls: wallsAround(bot),
        reward: predator.getRewardSinceLastUpdateAndReset(),
        entities: nearbyEntities,
    });
}
