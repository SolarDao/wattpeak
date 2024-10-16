import { getCosmWasmClient } from "../setup/junoSetup";

const WATTPEAK_STAKER_CONTRACT = process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS ?? "";

export async function queryStakers(address: string) {
  try {
    const client = await getCosmWasmClient();
    const queryMsg = {
      staker: { address },
    };
    
    const queryResult = await client.queryContractSmart(WATTPEAK_STAKER_CONTRACT, queryMsg);
    
    // Check if the result contains the expected properties, otherwise return default values
    if (!queryResult || !queryResult.wattpeak_staked || !queryResult.claimable_rewards) {
      return {
        wattpeak_staked: 0,
        claimable_rewards: 0,
        interest_wattpeak: 0,
      };
    }

    return queryResult;
  } catch (error) {
    console.error("Error querying stakers:", error);

    // Return default values in case of an error
    return {
      wattpeak_staked: 0,
      claimable_rewards: 0,
      interest_wattpeak: 0,
    };
  }
}
