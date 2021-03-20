import json
import numpy as np
import asyncio
import websockets
import threading

from ml import run_ml

# When new data are inserted into "shared_data.observable", the WS thread
# notifies the ML thread about it via this event. The ML thread awaits this
# event and then copies the data from it. Once it's done copying, it clears the
# event. This ensures that each state and reward is only used once.
#
# TODO: In the next iteration, I'd like to use a queue for synchronization.
# Then I'd have say 7 bots, and the MC adapter sending state updates much more
# frequently. This would mean the ML thread would not spend most of its time
# waiting for data. Currently, the system is terribly inefficient. Simple
# enough for testing though.
observable_data_ready_event = threading.Event()

# This object holds data which ML thread and WS thread exchange. The ML thread
# reads "observable" and WS writes it. Vice-versa, the ML thread writes
# "action" and WS reads it. Therefore GIL is in charge of synchronizing access
# to the memory.
# The "observable" has further synchronization: the
# "observable_data_ready_event".
shared_data = {
    "action": {"x": 0, "z": 0},
    "observable": {"reward": 0, "walls": None, "entities": None},
}

# How many entities will the server send every time (and pad with zeros
# if there are not enough).
# TODO: move to some settings section
nearest_entities_to_send = 9


async def connect_to_adapter():
    global observable_data

    uri = "ws://localhost:8999"
    async with websockets.connect(uri) as websocket:
        assert_ok(await recv_message(websocket))
        print("Connected to MC adapter WS server")

        print("Sending init message")
        await websocket.send(init_message("joe", nearest_entities_to_send))
        print("Awaiting greeting message")
        assert_ok(await recv_message(websocket))

        print("Listening for messages")
        while True:
            message = await recv_message(websocket)
            assert_ok(message)

            # IMPORTANT: mutating global variable ok because GIL + we're the
            #            only ones doing it here
            shared_data["observable"] = message["body"]
            # informs the ML thread that new data is ready to be consumed
            observable_data_ready_event.set()

            # reads the latest action decided by ML thread
            direction = shared_data["action"].copy()

            # send the current value of the shared action vec
            await websocket.send(action_message(direction["x"], direction["z"]))


async def recv_message(websocket):
    return json.loads(await websocket.recv())


def assert_ok(message):
    assert message["status"] == "ok", message["message"]


def init_message(username, nearest_entities_to_send):
    return json.dumps(
        {
            "route": "init",
            "payload": {
                "username": username,
                "nearestEntitiesToSend": nearest_entities_to_send,
            },
        }
    )


def action_message(x, z):
    return json.dumps({"route": "turn", "payload": {"x": x, "z": z}})


# runs the training in another thread
# TODO: this is an inefficient way of training
ml = threading.Thread(
    target=run_ml,
    args=(
        nearest_entities_to_send,
        shared_data,
        observable_data_ready_event,
    ),
)
ml.start()

asyncio.get_event_loop().run_until_complete(connect_to_adapter())
ml.join()
