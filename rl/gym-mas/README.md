# `gym-mas`

This python package contains environments which are used in [my
experiments][manyagents-experiments]. To install this package, run `pip install
-e gym-mas`.

## Environments

### `ppp-alpha-v0`
Predator-prey pursuit which reads data received from MC adapter. In the MC
world, there's a cage with ocelots. Bots join the world and are spawned into
the cage. They automatically hit nearby ocelots. They are rewarded when an
ocelot dies near them. A bot can be controlled by changing the direction it's
facing (it's auto-walking): `x` and `z` coordinates (`y` is height in MC,
irrelevant).

There's no communication going on in this environment. I use it as an example
env to test implementations.

The constructor accepts three parameters, see the
[class](gym_mas/envs/ppp_alpha.py) for more information.

```python
env = gym.make(
    "gym_mas:ppp-alpha-v0",
    nearest_entities_to_send=nearest_entities_to_send,
    observable_data_ready_event=observable_data_ready_event,
    shared_data=shared_data,
)
```

<!-- Rerefences -->
[manyagents-experiments]: https://manyagents.ai/posts/002_communication#experiments
