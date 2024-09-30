import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_STARGAZE_RPC_ENDPOINT || '';
const swapContractAddress = process.env.NEXT_PUBLIC_NFT_SWAPPER_CONTRACT_ADDRESS || ''; 

export default async function handler(req, res) {
  try {
    const client = await CosmWasmClient.connect(rpcEndpoint);
    const queryMsg = { config: {} }; // Modify the query message as per the contract schema
    
    const queryResult = await client.queryContractSmart(swapContractAddress, queryMsg);
    res.status(200).json(queryResult);
  } catch (error) {
    console.error('Error in queryNftConfig API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
