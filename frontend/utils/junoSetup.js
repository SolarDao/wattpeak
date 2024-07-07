import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_JUNO_RPC_ENDPOINT;

export async function getCosmWasmClient() {
  const client = await CosmWasmClient.connect(rpcEndpoint);
  console.log("Connected to Stargaze:", client);
  return client;
}
