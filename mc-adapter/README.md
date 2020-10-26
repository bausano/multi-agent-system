# Minecraft adapter
Since [Mineflayer][mineflayer-git] seem to be the most mature option to communicate with a MC server using [high-level APIs][mineflayer-api], we construct an adapter which exports useful APIs over [WebSockets][websockets-npm].

The protocol has been designed specifically for the use case of consuming it from python's environment class. That is a single connection to the adapter supports one player.

## Env
See the `.env.example` file for configuration options. Before you run the adapter, you can clone that file and rename it to `.env`.

## Protocol
All payloads are JSON strings.

Upon connection, the server sends [an `ok` message](#ok-message). The server then waits for the client to send a message `init` which tells the adapter how to set up the bot.

```
init message
---
{
    "init": {
        "host": string,
        "port": number,
        "username": string,
        "behavior": enum
    }
}
```

The property `behavior` selects some useful preprogrammed patterns which we want to automate. It depends on what the adapter has built-in. See [list of behaviors](#list-of-behaviors) for the enumeration of what values the `behavior` property can have.

If there's an issue connecting to the server, it sends back [an `error` message][#error-message]. After the adapter connects to the server, it sends back an `ok` message. This signal lets the client know that the state broadcasting is about to start and it can send actions.

The server will periodically send a state update message with information about the environment. Currently the state message contains vectors without any hint to what the vectors represent. The protocol makes guarantees about the length of each vector.

```
state message
---
{
    "state": {
        "entities": number[][],
        "walls": number[]
    }
}
```

The `walls` property is always 9 numbers which represent the area around the bot. The numbers can be either 1 for wall present, or 0 for no wall.

```
+---|---|---+
| 0 | 1 | 2 |
+---|---|---+
| 3 | 4 | 5 |
+---|---|---+
| 6 | 7 | 8 |
+---|---|---+
```

The `entities` property can have at most 10 vectors. Each of the vectors represent a nearby entity. Each entity is then represented with 7 numbers which include information about username (hashed), health, position, velocity and distance to the bot.

The frequency at which the state update is configurable with `STATE_UPDATE_INTERVAL_MS`.

TODO: apply an action, broadcast a reward, respawn

### Error message
To let the client know that something went wrong, the server sends `error` message.

```
error message
---
{
    "error": {
        "reason": string
    }
}
```

The `reason` property gives an explanation of what went wrong.

There is no error message code or no way of telling in response to which message did the error occur. While this would be a nice to have, it is not valuable enough at the moment to spend time on.

### Ok message
```
ok message
---
{
    "ok": {}
}
```

### List of behaviors
#### `run-and-hit-ocelot`
This behavior sets the bot to always move forward (as if it always held **W**) and keep hitting periodically the closest entity if it's an ocelot. We picked ocelot because it is swift and runs away from players by default.

<!-- Invisible List of References -->
[mineflayer-git]: https://github.com/PrismarineJS/mineflayer
[websockets-npm]: https://www.npmjs.com/package/websocket
[mineflayer-api]: https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botswingarmhand
