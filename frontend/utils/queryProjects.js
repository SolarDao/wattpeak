import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_JUNO_RPC_ENDPOINT; // Juno testnet RPC endpoint
const MINTER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS;

export async function queryProjects() {
  const client = await CosmWasmClient.connect(rpcEndpoint);

  const queryMsg = { projects: {} }; // Adjust this message based on your contract's query structure

  const queryResult = await client.queryContractSmart(MINTER_CONTRACT_ADDRESS, queryMsg);
  return queryResult.projects;
}
