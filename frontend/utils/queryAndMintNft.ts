import { getSigningCosmWasmClient } from "./junoSetup";

const nftContractAddress = process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS;

export async function queryNftConfig() {
  const client = await getSigningCosmWasmClient();
  
  const queryMsg = { config: {} };
  
  const queryResult = await client.queryContractSmart(nftContractAddress, queryMsg);
  
  return queryResult;
}

export async function mintNft(amount, walletAddress) {
  const client = await getSigningCosmWasmClient();

  const executeMsg = {
    mint: {
      amount: amount,
    },
  };

  const result = await client.execute(walletAddress, nftContractAddress, executeMsg, "auto");

  return result;
}
