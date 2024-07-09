import { StargateClient } from "@cosmjs/stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_JUNO_RPC_ENDPOINT; // Juno testnet RPC endpoint

export async function getBalances(address) {
  if (!address) {
    throw new Error("Address is required");
  }

  if (!address.startsWith('juno')) {
      return [];
  }

  const client = await StargateClient.connect(rpcEndpoint);
  const balances = await client.getAllBalances(address);
  console.log("Balances:", balances);
  return balances;
}
