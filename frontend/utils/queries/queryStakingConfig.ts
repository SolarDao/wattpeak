import { getCosmWasmClient } from "../setup/junoSetup";

const nftContractAddress = process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS;

export async function queryStakingConfig() {
  const client = await getCosmWasmClient();
  
  const queryMsg = { config: {} };
  
  let queryResult;
  
  if (nftContractAddress) {
    queryResult = await client.queryContractSmart(nftContractAddress, queryMsg);
  } else {
    throw new Error("Staking contract address is undefined.");
  }
  
  return queryResult;
}
