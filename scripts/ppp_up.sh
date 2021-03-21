#!/bin/bash

## Provisions mc server for predator-prey pursuit experiment in a
## docker container.
##
## It creates the server and builds a cage around the [0, 4, 0] coordinate
## (assuming "world_height" is 4).
## The spawn point is set to this coordinate.
##
## TODO: It'd would be great if we could add [this mod][tickrate-changer] to
## the server. That'd allow us to train the agents faster.
##
## [tickrate-changer]: https://github.com/Guichaguri/TickrateChanger

set -e

# the port on which the minecraft server listens can be configured with
# $SERVER_PORT env
readonly server_port=${SERVER_PORT:-25565}
# we create a flat plane world in which the "y" coordinate directly above grass
# is 4, and we will want to create the cage at this height
readonly world_height=4
# the size of one side of the cage square in blocks
readonly cage_size=100
readonly half_cage_size=$(( cage_size / 2 ))
# the cage is bounded by an oak fence to hold the ocelots and the bots in
readonly cage_block="minecraft:oak_fence"
# the in-game nick of the minecraft account that the admin logs in
readonly admin_nick=${ADMIN_NICK:-porkbrain}
readonly cont_name="experiment_ppp"

function rcon {
    ## Executes given command in rcon-cli.

    local cmd=$1

    docker exec "${cont_name}" rcon-cli "${cmd}"
}

echo
echo "Spawning a container '${cont_name}' in a detached mode on port ${server_port}..."
docker run -d --rm \
    -p ${server_port}:25565 \
    --name "${cont_name}" \
    -e EULA=TRUE \
    -e DIFFICULTY=peaceful \
    -e GENERATE_STRUCTURES=false \
    -e SPAWN_MONSTERS=false \
    -e LEVEL_TYPE=flat \
    -e ONLINE_MODE=FALSE \
    -e MODE=survival \
    itzg/minecraft-server

echo "Waiting for the Minecraft server to be up..."
# temporarily allow commands to fail as we're checking the status manually
set +e
2>/dev/null 1>&2 rcon "help"
while [ $? -ne 0 ]; do
    echo "[$(date)] rcon-cli still not up..."
    sleep 5
    # repeat the command because of "$?" in the "while"
    2>/dev/null 1>&2 rcon "help"
done
set -e

echo
echo "Setting up the environment..."
# sets spawn to [0, 4, 0]
rcon "setworldspawn 0 ${world_height} 0"

# creates the cage to which the entities are constrained
# one side is "cage_size" long, in each iteration it lays 4 fences
#
# # Example
# Assume that the "cage_size" is 100.
#
# ```
# [-50; 50]                   [50; 50]
#     o--------------------------o
#     |                          |
#     |                          |
#     |            x             |
#     |          [0; 0]          |
#     |                          |
#     |                          |
#     o--------------------------o
# [-50; -50]                  [50; -50]
# ```
#

echo
echo "Building the cage which bounds the experiment..."
# builds the left vertical wall [(-50, -50); (-50, 50)]
rcon "fill -${half_cage_size} ${world_height} -${half_cage_size} \
-${half_cage_size} ${world_height} ${half_cage_size} \
${cage_block} replace"

# builds the right vertical wall [(50, -50); (50, 50)]
rcon "fill ${half_cage_size} ${world_height} -${half_cage_size} \
${half_cage_size} ${world_height} ${half_cage_size} \
${cage_block} replace"

# builds the bottom horizontal wall [(-50, -50); (50, -50)]
rcon "fill -${half_cage_size} ${world_height} -${half_cage_size} \
${half_cage_size} ${world_height} -${half_cage_size} \
${cage_block} replace"

# builds the top horizontal wall [(-50, 50); (50, 50)]
rcon "fill -${half_cage_size} ${world_height} ${half_cage_size} \
${half_cage_size} ${world_height} ${half_cage_size} \
${cage_block} replace"

echo "Minecraft server ${cont_name}:${server_port} ready!"
