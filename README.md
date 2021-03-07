# Communication in multi-agent systems (MAS)
Communication is an emergent behaviour in multi-agent systems. An agent under
this behaviour transmits signals with the _intention_ of informing peers about
an internal or external state. An agent’s peers are other agents in the
environment whose _goals are aligned_ with goals of the agent. All agents
pursuing common goal in an environment form a collective.

This source code goes hand in hand with my [series of articles on communication
in MAS][manyagents-communication]. Each experiment is or will be implemented
here.

The [Minecraft adapter](./mc-adapter) is a Websocket server which serves as a
medium between the ML algorithms and Minecraft. It's responsibilities are:
- maintain connection to the Minecraft server for each agent
- collect the environment into a form suitable for ML
- relays actions from ML into Minecraft bot actions
- calculate rewards

The [python ML](./rl) is still WIP, there isn't much to see yet.

<!-- References -->
[manyagents-communication]: https://manyagents.ai/tags/communication
