import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_STARGAZE_RPC_ENDPOINT; // Stargaze RPC endpoint
const contractAddress = process.env.NEXT_PUBLIC_SOLAR_HERO_CONTRACT_ADDRESS; // NFT contract address

export async function queryNftsByAddress(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  const client = await CosmWasmClient.connect(rpcEndpoint);
  const queryMsg = { tokens: { owner: address, limit: 10 } }; // Modify the query message as per the contract schema

  const queryResult = await client.queryContractSmart(contractAddress, queryMsg);
  console.log("Query Result:", queryResult);
  return queryResult;
}
