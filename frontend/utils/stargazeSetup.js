import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_STARGAZE_RPC_ENDPOINT;

export async function getCosmWasmClient() {
  const client = await CosmWasmClient.connect(rpcEndpoint);
  return client;
}
