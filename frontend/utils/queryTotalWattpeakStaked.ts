import { getCosmWasmClient } from "./junoSetup";

const nftContractAddress = process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS ?? '';

export async function queryTotalWattpeakStaked() {
  const client = await getCosmWasmClient();
  
  const queryMsg = { TotalWattpeakStaked: {} };
  
  const queryResult = await client.queryContractSmart(nftContractAddress, queryMsg);
  
  return queryResult;
}
