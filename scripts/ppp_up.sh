#!/bin/bash

# Provisions mc server for prey pursuit experiment in a docker container.

set -e

readonly world_height=4
readonly cage_size=100
readonly half_cage_size=$(( cage_size / 2 ))
readonly cage_block="minecraft:oak_fence"

function rcon {
    ## Executes given command in rcon cli

    local cmd=$1

    docker exec mc rcon-cli "${cmd}"
}

echo "Spawning server container in detached mode..."
docker run -d --rm \
    -p 25565:25565 \
    --name mc \
    -e EULA=TRUE \
    -e DIFFICULTY=peaceful \
    -e GENERATE_STRUCTURES=false \
    -e SPAWN_MONSTERS=false \
    -e LEVEL_TYPE=flat \
    -e ONLINE_MODE=FALSE \
    -e MODE=survival \
    itzg/minecraft-server

echo "Waiting for server to be up..."
set +e
2>/dev/null 1>&2 rcon "help"
while [ $? -ne 0 ]; do
    echo "[$(date)] rcon-cli still not up..."
    sleep 5
    2>/dev/null 1>&2 rcon "help"
done
set -e

# creates the cage to which the entities are constrained
#
# ```
# [-50; 50]                   [50; 50]
#     o--------------------------o
#     |                          |
#     |                          |
#    ...          [0; 0]        ...
#     |                          |
#     |                          |
#     o--------------------------o
# [-50; -50]                  [50; -50]
# ```
echo "Setting up environment..."
rcon "setworldspawn 0 ${world_height} 0"
# TODO: pass mod name
rcon "op porkbrain"
for i in $(seq 0 $cage_size)
do
    # goes from -50 to 50 over the course of the loop
    x=$(( i - half_cage_size ))

    rcon "setblock ${x} ${world_height} ${half_cage_size} ${cage_block} replace"
    rcon "setblock ${x} ${world_height} -${half_cage_size} ${cage_block} replace"
    rcon "setblock ${half_cage_size} ${world_height} ${x} ${cage_block} replace"
    rcon "setblock -${half_cage_size} ${world_height} ${x} ${cage_block} replace"
done

