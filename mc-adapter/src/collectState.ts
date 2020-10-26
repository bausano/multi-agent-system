import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import { Connection } from "./types/Connection";
import { ServerMessage } from "./types/messages";

// Id of the fence block.
const WALL_BLOCK = 191;

/**
 * Observes the space around the bot and summarizes it for the machine learning
 * algorithm.
 */
export async function collectState(conn: Connection): Promise<ServerMessage> {
    const bot = conn.bot;
    const allNearbyEntities = Object.values(bot.entities).map((entity) => {
        return {
            entity,
            sqDist: bot.entity.position.distanceSquared(entity.position),
        };
    });
    // Sorts the entities in ascending order.
    allNearbyEntities.sort((a, b) => a.sqDist - b.sqDist);
    // FIXME: Make the number of entities to send configurable.
    const nearbyEntities = allNearbyEntities
        .slice(0, 9)
        .map(({ sqDist, entity }) => {
            // Puts entity information into a list of numbers. Maybe it'd be
            // better if we published this data in a structured way and then
            // used it as list of numbers in the python code base, but this
            // saves some effort.
            // FIXME: Consider also calculating distance to some set position
            // such as (0, 0).
            // We only export x and z coordinate because we assume that the
            // distance to bedrock is constant.
            // FIXME: There're many issues with the types of the mineflayer lib.
            return [
                hashString(entity.username || (entity as any).uuid),
                sqDist,
                entity.position.x,
                entity.position.z,
                entity.velocity.x,
                entity.velocity.z,
                entity.health || 20,
            ];
        });

    // Gets all walls around a bot into a list.
    const walls = wallsAround(bot);

    return {
        state: { walls, entities: nearbyEntities },
    };
}

// Returns fences in 3x3 area around bot. The output will have 9 numbers.
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

// Generates single number pseudo hash.
// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
function hashString(input: string) {
    return input.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
    }, 0);
}
