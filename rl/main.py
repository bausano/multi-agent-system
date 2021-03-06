import json
import asyncio
import websockets


async def connect_to_adapter():
    uri = "ws://localhost:8999"
    async with websockets.connect(uri) as websocket:
        assert_ok(await recv_message(websocket))
        print("Connected to MC adapter WS server.")

        # how many entities will the server send every time (and pad with zeros
        # if there are not enough)
        nearest_entities_to_send = 9
        await websocket.send(init_message("joe", nearest_entities_to_send))
        assert_ok(await recv_message(websocket))

        print("Listening for messages...")
        while True:
            message = await recv_message(websocket)
            # TODO: put all into one list of numbers.
            # TODO: store above + reward in an env.
            print("State update message");
            await websocket.send(action_message(10, 10))



async def recv_message(websocket):
    return json.loads(await websocket.recv())


def assert_ok(message):
    assert message['status'] == "ok", message['message']


def init_message(username, nearest_entities_to_send):
    return json.dumps(
        {
            "route": "init",
            "payload": {
                "username": username,
                "nearestEntitiesToSend": nearest_entities_to_send
            }
        }
    )


def action_message(x, z):
    return json.dumps(
        {
            "route": "look"
            "payload": {
                "x": x,
                "z": z,
            }
        }
    )


asyncio.get_event_loop().run_until_complete(connect_to_adapter())
