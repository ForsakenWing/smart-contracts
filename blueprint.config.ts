import { Config } from "@ton/blueprint";
import "dotenv/config";

export const config: Config = {
  network: {
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    type: "testnet",
    version: "v2",
    key: process.env.TON_CENTER_API_KEY,
  },
};
