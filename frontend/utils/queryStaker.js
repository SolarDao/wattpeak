import { getCosmWasmClient } from "./junoSetup";

const WATTPEAK_STAKER_CONTRACT = process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS; // Replace with your contract address

export async function queryStakers( address ) {
  const client = await getCosmWasmClient();
  const queryMsg = {
    staker: { address }
  };
  
  const queryResult = await client.queryContractSmart(WATTPEAK_STAKER_CONTRACT, queryMsg);
  return queryResult;
}
