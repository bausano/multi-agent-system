import numpy as np

import gym
from gym import spaces
from gym.utils import seeding


class PredatorPreyPursuitAlpha(gym.Env):
    """Predator-prey pursuit alpha
    TODO
    """

    # @param nearest_entities_to_send       Tells us how many dimensions state
    #                                       observation has
    # @param observable_data_ready_event    Synchronization primitive, see main
    # @param shared_data                    The object shared with WS thread
    def __init__(
        self,
        nearest_entities_to_send,
        observable_data_ready_event,
        shared_data
    ):
        self.observable_data_ready_event = observable_data_ready_event
        self.shared_data=shared_data

        # An MC bot moves automatically forward. We change the direction in
        # which it moves by changing a point the bot looks at. We ignore the
        # third spacial dimension of MC and use a vector d for which d1, d2 ∊
        # [-1; 1].
        self.action_space = spaces.Box(low=-1, high=1, shape=(2,))

        # The MC adapter sends a message with the state observation. The
        # message contains a 9D vector of 1s and 0s. The vector represents
        # immediate surroundings - walls - around the agent: 1 = wall, 0 = no
        # wall.
        # Then an N dimensional vector of 7D vectors is sent. The inner vectors
        # represent information about one entity in the proximity of the bot.
        # The bot knows about at most N entities. N is
        # nearest_entities_to_send.
        # TODO: do we want just a list of numbers or this structure?
        self.observation_space = spaces.Dict(
            {
                "walls": spaces.Box(low=0, high=1, shape=(9,)),
                "entities": spaces.Box(shape=(nearest_entities_to_send, 7)),
            }
        )

    # Reads observation and reward from the MC adapter channel by using the
    # last message.
    def step(self, action):
        assert isinstance(action, (float, float))
        # IMPORTANT: this mutates memory shared with WS thread, but doesn't
        #            need synchronization because GIL + WS thread is a reader
        self.shared_data["action"] = action

        # wait until new data arrives from MC adapter to avoid training using
        # the same state over and over
        self.observable_data_ready_event.wait()
        observation = self.shared_data["observable"].copy()
        # invalidate the data for the next loop iteration, which results in
        # .wait() - until WS thread again receives new data from MC adapter
        self.observable_data_ready_event.clear()

        reward = observation["reward"]
        # TODO: let's transform it here instead of the main.py
        state = observation["state"]

        # this is handled outside of the env
        done = false
        return state, reward, done, []

    # We don't need to reset the environment for this experiment.
    def reset(self):
        pass
