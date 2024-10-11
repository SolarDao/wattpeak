import { StargateClient } from "@cosmjs/stargate";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_JUNO_RPC_ENDPOINT || "";
const cw20ContractAddress = process.env.NEXT_PUBLIC_CW20_CONTRACT_ADDRESS || ""; // Add the CW20 contract address

export async function getBalances(address: string | undefined) {
  if (!address) {
    throw new Error("Address is required");
  }

  if (!address.startsWith("juno")) {
    return [];
  }

  // Connect to the RPC node
  const client = await StargateClient.connect(rpcEndpoint);

  // Fetch native balances (like ujuno)
  const nativeBalances = await client.getAllBalances(address);

  // Connect to the RPC node using CosmWasmClient for querying smart contracts
  const wasmClient = await CosmWasmClient.connect(rpcEndpoint);

  // Query CW20 token balance from the contract
  const cw20BalanceResponse = await wasmClient.queryContractSmart(
    cw20ContractAddress,
    {
      balance: { address },
    }
  );

  // Extract the CW20 balance and denom (for example, this is a CW20 token, so you might set its denom)
  const cw20Balance = cw20BalanceResponse.balance || "0";

  // Format the CW20 balance to match the native balance structure
  const formattedCw20Balance = {
    amount: cw20Balance,
    denom: "solar", // You can give this a custom denom name for the CW20 token
  };

  // Merge native balances and CW20 balance into one iterable array
  const balancesResult = [...nativeBalances, formattedCw20Balance];

  return balancesResult;
}

