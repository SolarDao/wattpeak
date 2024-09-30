import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = "https://rpc.elgafar-1.stargaze-apis.com/"
const swapContractAddress = "stars1p3vxvjs4gu3z6avp090sp4fg2pk45e5ds2dc5r9tpfudqdzqs4gslxfgww"
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
