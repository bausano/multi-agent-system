#!/bin/bash

## Provisions mc server for predator-prey pursuit experiment in a
## docker container.
##
## It creates the server and builds a cage around the [0, 4, 0] coordinate
## (assuming "world_height" is 4).
## The spawn point is set to this coordinate.

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

echo "World height: ${world_height}"
echo "Cage size: ${cage_size}"

function rcon {
    ## Executes given command in rcon-cli.

    local cmd=$1

    docker exec mc rcon-cli "${cmd}"
}

echo "Spawning server container in detached mode on port ${server_port}..."
docker run -d --rm \
    -p ${server_port}:25565 \
    --name experiment_ppp \
    -e EULA=TRUE \
    -e DIFFICULTY=peaceful \
    -e GENERATE_STRUCTURES=false \
    -e SPAWN_MONSTERS=false \
    -e LEVEL_TYPE=flat \
    -e ONLINE_MODE=FALSE \
    -e MODE=survival \
    itzg/minecraft-server

echo "Waiting for server to be up..."
# temporarily allow commands to fail as we're checking the status manually
set +e
while [ 2>/dev/null 1>&2 rcon "help" -ne 0 ]; do
    echo "[$(date)] rcon-cli still not up..."
    sleep 5
done
set -e

# creates the cage to which the entities are constrained
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

echo "Setting up environment..."
# sets spawn to [0, 4, 0]
rcon "setworldspawn 0 ${world_height} 0"
# gives admin full permissions
rcon "op ${admin_nick}"

# builds the cage, one side is "cage_size" long, in each iteration it lays
# 4 fences
# TODO: we can perhaps run all jobs in background and then just await then all
# at the end of the script to speed up
for i in $(seq 0 $cage_size)
do
    # goes from -50 to 50 over the course of the loop
    x=$(( i - half_cage_size ))

    rcon "setblock ${x} ${world_height} ${half_cage_size} ${cage_block} replace"
    rcon "setblock ${x} ${world_height} -${half_cage_size} ${cage_block} replace"
    rcon "setblock ${half_cage_size} ${world_height} ${x} ${cage_block} replace"
    rcon "setblock -${half_cage_size} ${world_height} ${x} ${cage_block} replace"
done

