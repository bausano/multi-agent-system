def run_ml(
    nearest_entities_to_send,
    shared_data,
    observable_data_ready_event,
):
    while True:
        observable_data_ready_event.wait()
        observable = shared_data["observable"].copy()
        observable_data_ready_event.clear()
        shared_data["action"] = {"x": 1, "z": 0}
