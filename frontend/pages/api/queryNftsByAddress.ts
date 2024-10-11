import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = "https://rpc.elgafar-1.stargaze-apis.com/";
const nftContractAddress = "stars1t0zz2rp7nshlhrsjlrj9cd8n09hxy5stvt5nlvcv0zjlhf5efdfsqh9wk5";
const ipfsGateway = "https://solar.mypinata.cloud/ipfs/"; // Dedicated IPFS gateway
const pinataGatewayToken = process.env.PINATA_API_KEY;
export default async function handler(req: { query: { address: string; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error?: string; nfts?: any[]; }): void; new(): any; }; }; }) {
  try {
    const { address } = req.query;

    if (!address) {
      res.status(400).json({ error: 'Missing address parameter' });
      return;
    }

    const client = await CosmWasmClient.connect(rpcEndpoint);

    const tokensQuery = { tokens: { owner: address } };
    const { tokens } = await client.queryContractSmart(nftContractAddress, tokensQuery);

    const metadataPromises = tokens.map(async (tokenId: string) => {
      const tokenUriQuery = { nft_info: { token_id: tokenId } };
      const { token_uri } = await client.queryContractSmart(nftContractAddress, tokenUriQuery);
      
      // Replace ipfs:// with the dedicated IPFS gateway and append the Pinata gateway token
      const ipfsUrl = token_uri.replace('ipfs://', `${ipfsGateway}`) + `?pinataGatewayToken=${pinataGatewayToken}`;
      
      const response = await fetch(ipfsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata for token ${tokenId}`);
      }
      const metadata = await response.json();
      return {
        tokenId,
        ...metadata,
      };
    });

    const nfts = await Promise.all(metadataPromises);
    res.status(200).json({ nfts });
  } catch (error) {
    console.error('Error in queryNftsByAddress API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
