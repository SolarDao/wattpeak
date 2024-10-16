import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = "https://rpc.elgafar-1.stargaze-apis.com/"
const swapContractAddress = "stars1cxvnq7cv8uzfpqxz0ql9xjfamzl957247vmncxr3387nskj838fqm8c9m5"
export default async function handler(req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): void; new(): any; }; }; }) {
  try {
    const client = await CosmWasmClient.connect(rpcEndpoint);
    const queryMsg = { config: {} }; 
    
    const queryResult = await client.queryContractSmart(swapContractAddress, queryMsg);
    res.status(200).json(queryResult);
  } catch (error) {
    console.error('Error in queryNftConfig API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
