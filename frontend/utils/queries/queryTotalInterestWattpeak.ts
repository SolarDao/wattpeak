import { getCosmWasmClient } from "../setup/junoSetup";

const nftContractAddress = process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS ?? '';

export async function queryTotalInterestWattpeak() {
    const client = await getCosmWasmClient();
  
    const queryMsg = { total_interest_wattpeak: {} };
  
    try {
      const queryResult = await client.queryContractSmart(nftContractAddress, queryMsg);
      return queryResult;
    } catch (error) {
      console.error("Error querying total interest WattPeak:", error);
      throw error;
    }
  }
  