import json
import asyncio
import websockets


async def connect_to_adapter():
    uri = "ws://localhost:8999"
    async with websockets.connect(uri) as websocket:
        assert is_ok(await recv_message(websocket)), "Cannot connect to the adapter"
        print("Connected to MC adapter WS server.")
        await websocket.send(init_message("joe", "localhost", 38531))
        assert is_ok(await recv_message(websocket)), "Cannot connect to MC server"
        print("Listening for messages...")
        while True:
            message = await recv_message(websocket)
            if is_state_update(message):
                # Pad the entities with zeros.
                # Put all into one list of numbers.
                # Store in an env.
                continue
            if is_reward_update(message):
                # Store in an env.
                continue


async def recv_message(websocket):
    return json.loads(await websocket.recv())


def is_ok(message):
    if not "ok" in message:
        print("Expected ok message, got: ")
        print(message)
    return "ok" in message


def is_state_update(message):
    return "state" in message


def is_reward_update(message):
    return "reward" in message


def init_message(username, host, port):
    return json.dumps(
        {
            "init": {
                "username": username,
                "host": host,
                "port": port,
                "behavior": "run-and-hit-ocelot",
            }
        }
    )


asyncio.get_event_loop().run_until_complete(connect_to_adapter())
