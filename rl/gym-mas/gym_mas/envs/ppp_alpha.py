import numpy as np

import gym
from gym import spaces
from gym.utils import seeding


class PredatorPreyPursuitAlphaEnv(gym.Env):
    """Predator-prey pursuit alpha
    TODO

    # Args
    - `nearest_entities_to_send` tells us how many dimensions the state has
    - `observable_data_ready_event` is a synchronization primitive which allows
        the environment to wait for fresh data from the MC adapter rather than
        reusing old observation
    - `shared_data` is an object shared with the WS thread which contains the
        current action (mutated by this env) and the latest observation
        (mutated by the WS thread)
    """

    def __init__(
        self, nearest_entities_to_send, observable_data_ready_event, shared_data
    ):
        self.observable_data_ready_event = observable_data_ready_event
        self.shared_data = shared_data

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
        # We put it all into a one list of numbers.
        observation_space_size = 9 + nearest_entities_to_send * 7
        self.observation_space = spaces.Box(
            low=-np.inf, high=np.inf, shape=(observation_space_size,)
        )

    # Reads observation and reward from the MC adapter channel by using the
    # last message.
    def step(self, action):
        assert isinstance(action, (tuple)), "Action must be float tuple"
        x = action[0]
        z = action[1]
        assert isinstance(x, (float)), "First tuple member must be float"
        assert isinstance(z, (float)), "Second tuple member must be float"

        # IMPORTANT: this mutates memory shared with WS thread, but doesn't
        #            need synchronization because GIL + WS thread is a reader
        self.shared_data["action"] = {"x": x, "z": z}

        # wait until new data arrives from MC adapter to avoid training using
        # the same state over and over
        self.observable_data_ready_event.wait()
        observation = self.shared_data["observable"].copy()
        # invalidate the data for the next loop iteration, which results in
        # .wait() - until WS thread again receives new data from MC adapter
        self.observable_data_ready_event.clear()

        reward = observation["reward"]

        # 9D vec of 1s and 0s
        walls = observation["walls"]
        # 7 * nearest_entities_to_send vec of (-inf; inf)
        entities = list(np.concatenate(observation["entities"]).flat)
        # concats all into vec, see self.observation_space
        state = list(np.concatenate([walls, entities]).flat)

        # this is handled outside of the env
        done = False
        return state, reward, done, []

    # We don't need to reset the environment for this experiment.
    def reset(self):
        pass
