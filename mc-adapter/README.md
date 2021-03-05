# Minecraft adapter
Since [Mineflayer][mineflayer-git] seem to be the most mature option to
communicate with a MC server using [high-level APIs][mineflayer-api], we
construct an adapter which exports useful APIs over
[WebSockets][websockets-npm].

The protocol has been designed specifically for the use case of consuming it
from python's environment class. A single connection to the adapter supports
one agent.

## Env
See the `.env.example` file for configuration options. Before you run the
adapter, you can clone that file and rename it to `.env`.

## Protocol
All messages are JSON strings which follow the same structure. The server
schema for success and error messages respectively:

```
{
  "status": "ok",
  "body": any
}
```

```
{
  "status": "err",
  "message": string
}
```

The client is expected to send messages in following schema:

```
{
  "route": string,
  "payload": any
}
```

Upon connection, the server sends an ok message with body string `"ready"`. The
rest depends on the experiment which the adapter runs.

### Predator-prey pursuit (ppp)
In this experiment, predators (agents) pursuit prey (Minecraft ocelots).
Ocelots were chosen because they run away from players. An agent automatically
attacks nearest ocelot (if close enough). An agent is forced to sneak which
gives the ocelots an advantage. An agent is always walking forward, the agent
only controls the direction by changing the point at which the Minecraft bot
looks at. This setup results in a single possible action consisting of two
floats, the coordinates of the point.

The server waits for the client to send a message `init` which tells the
adapter how to set up the bot.

```
init client message
---
{
    "route": "init",
    "payload": {
        "username": string,
        "nearestEntitiesToSend": number
    }
}
```

The `nearestEntitiesToSend` parameter dictates how much state is observed. See
docs below.

If there's an issue connecting to the server, it sends back an error message.
After the adapter connects to the server, it sends back an `ok` message. This
signal lets the client know that the state broadcasting is about to start and
it can send actions.

The server will periodically send a state update message with information about
the environment. Currently the state message contains vectors without any hint
to what the vectors represent. The protocol makes some guarantees about the
length of each vector.

```
state server message
---
{
    "status": "ok",
    "body": {
        "reward": number,
        "entities": number[][],
        "walls": number[]
    }
}
```

The `walls` property is always a 9D vector which represent the area around the
bot. The numbers can be either 1 for wall present, or 0 for no wall.

```
+---+---+---+
| 0 | 1 | 2 |
+---|---|---+
| 3 | 4 | 5 |
+---|---|---+
| 6 | 7 | 8 |
+---+---+---+
```

The `entities` property has exactly `nearestEntitiesToSend` vectors. Each of
the vectors represent a nearby entity. Each entity is then represented with 7
numbers which include information about username (hashed), health, position,
velocity and distance to the bot. This means that when flattened, the
`entities` property contains `nearestEntitiesToSend` * 7 numbers. If there are
less than `nearestEntitiesToSend` entities around the agent, the rest will be
padded with zeros.

The `reward` property is a single number which tracks how much reward has the
bot received since the last time a state update message was broadcast.

The frequency at which the state update is configurable with
`SEND_STATE_PERIOD_MS`.

The agent changes the point at which the Minecraft bot looks at, thereby
changing the direction of movement:

```
action client message
{
  "route": "look",
  "payload": {
    "x": number,
    "z": number
  }
}
```

<!-- Invisible List of References -->
[mineflayer-git]: https://github.com/PrismarineJS/mineflayer
[websockets-npm]: https://www.npmjs.com/package/websocket
[mineflayer-api]: https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botswingarmhand
