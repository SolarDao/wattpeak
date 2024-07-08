import { getCosmWasmClient } from "./junoSetup"; // Adjust the import path if necessary

const WATTPEAK_STAKER_CONTRACT = process.env.NEXT_PUBLIC_JUNO_RPC_ENDPOINT; // Replace with your contract address

export async function queryStakers() {
  const client = await getCosmWasmClient();
  
  const queryMsg = { stakers: {} };
  
  const queryResult = await client.queryContractSmart(WATTPEAK_STAKER_CONTRACT, queryMsg);
  return queryResult;
}
