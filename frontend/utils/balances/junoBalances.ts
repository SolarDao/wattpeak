import { StargateClient } from "@cosmjs/stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_JUNO_RPC_ENDPOINT || "";

export async function getBalances(address: string | undefined) {
  if (!address) {
    throw new Error("Address is required");
  }

  if (!address.startsWith('juno')) {
      return [];
  }

  const client = await StargateClient.connect(rpcEndpoint);
  const balances = await client.getAllBalances(address);
  return balances;
}
