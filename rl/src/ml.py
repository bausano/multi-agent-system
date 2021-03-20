import gym

# TODO: rename file and add docs
def run_ml(
    nearest_entities_to_send,
    shared_data,
    observable_data_ready_event,
):
    env = gym.make(
        "gym_mas:ppp-alpha-v0",
        nearest_entities_to_send=nearest_entities_to_send,
        observable_data_ready_event=observable_data_ready_event,
        shared_data=shared_data,
    )

    while True:
        (state, reward, _done, _) = env.step((float(1), float(0)))
        # TODO: train some simple DNN
