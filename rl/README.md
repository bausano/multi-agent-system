# MAS RL

## Useful commands
To create a new virtual environment:

```bash
python3 -m venv kerasenv
```

Install following packages:

```bash
pip install black websockets asyncio \
    numpy pandas matplotlib scipy scikit-learn wheel \
    keras keras-rl
```

To active the environment:

```bash
cd kerasenv && source bin/activate && cd ..
```

To quit the environment:

```
deactivate
```

## Resources
[Denny Britz's][dennybritz] and the official [`keras-rl`][keras-rl-examples]
repositories contain many examples of RL implementations. To implement the
connection with the [Minecraft adapter's WS server](../mc-adapter), see [this
SO answer][so-custom-env] on custom gym envs and [this sample
env][gym-sample-env]. There's also a very useful tutorial by [Ashish
Poddar][custom-env-2] which shows how to structure the code. However, the code
base assumes that no parameters are passed to the environment. Here's a [SO
answer] which shows how to construct a gym with parameters.

<!-- References -->
[dennybritz]: https://github.com/dennybritz/reinforcement-learning
[so-custom-env]: https://stackoverflow.com/questions/44469266/how-to-implement-custom-environment-in-keras-rl-openai-gym
[keras-rl-examples]: https://github.com/keras-rl/keras-rl/tree/master/examples
[gym-sample-env]:  https://github.com/openai/gym/blob/master/gym/envs/toy_text/hotter_colder.py
[custom-env-2]: https://medium.com/@apoddar573/making-your-own-custom-environment-in-gym-c3b65ff8cdaa
[so-env-arg]: https://stackoverflow.com/questions/54259338/how-to-pass-arguments-to-openai-gym-environments-upon-init
