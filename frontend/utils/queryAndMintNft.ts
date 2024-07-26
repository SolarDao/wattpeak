import { getCosmWasmClient } from "./junoSetup";

const nftContractAddress = process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS;

export async function queryNftConfig() {
  const client = await getCosmWasmClient();
  
  const queryMsg = { config: {} };
  
  let queryResult;
  
  if (nftContractAddress) {
    queryResult = await client.queryContractSmart(nftContractAddress, queryMsg);
  } else {
    throw new Error("NFT contract address is undefined.");
  }
  
  return queryResult;
}

export async function mintNft(amount: number, walletAddress: string) {
  const client: any = await getCosmWasmClient();

  const executeMsg = {
    mint: {
      amount: amount,
    },
  };

  const result = await client.execute(walletAddress, nftContractAddress, executeMsg, "auto");

  return result;
}
