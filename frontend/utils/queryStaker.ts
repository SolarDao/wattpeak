import { getCosmWasmClient } from "./junoSetup";

const WATTPEAK_STAKER_CONTRACT = process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS ?? "";

export async function queryStakers( address: string ) {
  const client = await getCosmWasmClient();
  const queryMsg = {
    staker: { address }
  };
  
  const queryResult = await client.queryContractSmart(WATTPEAK_STAKER_CONTRACT, queryMsg);
  return queryResult;
}
