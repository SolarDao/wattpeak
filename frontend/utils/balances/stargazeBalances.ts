import { StargateClient } from "@cosmjs/stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_STARGAZE_RPC_ENDPOINT; // Juno testnet RPC endpoint

export async function getStargazeBalances(address: string) {
  if (!address) {
    throw new Error("Address is required");
  }

  if (!address.startsWith('stars')) {
      return [];
  }

  const client = await StargateClient.connect(rpcEndpoint ?? '');
  const balances = await client.getAllBalances(address);
  
  return balances;
}
