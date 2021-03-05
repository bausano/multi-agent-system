import { config as dotenv } from "dotenv";
import { Config } from "@/models/config";
import { createWsServer } from "./server";
import { App } from "./app";
import { PredatorPreyPursuit } from "@ppp/index";

dotenv();

const config = new Config();
// here we can select other experiments in future
const experiment = new PredatorPreyPursuit(config);

// create server and listen to new connections
const ws = createWsServer(config);
new App(ws, config, experiment);
