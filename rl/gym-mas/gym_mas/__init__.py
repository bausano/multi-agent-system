from gym.envs.registration import register

register(
    id="ppp-alpha-v0",
    entry_point="gym_mas.envs:PredatorPreyPursuitAlphaEnv",
)
