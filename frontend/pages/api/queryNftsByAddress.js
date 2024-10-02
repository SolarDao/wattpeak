import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = "https://rpc.elgafar-1.stargaze-apis.com/"
const nftContractAddress = "stars1t0zz2rp7nshlhrsjlrj9cd8n09hxy5stvt5nlvcv0zjlhf5efdfsqh9wk5"
const ipfsGateway = "https://gateway.pinata.cloud/ipfs/";

export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address) {
      res.status(400).json({ error: 'Missing address parameter' });
      return;
    }

    const client = await CosmWasmClient.connect(rpcEndpoint);

    const tokensQuery = { tokens: { owner: address } };
    const { tokens } = await client.queryContractSmart(nftContractAddress, tokensQuery);

    const metadataPromises = tokens.map(async (tokenId) => {
      const tokenUriQuery = { nft_info: { token_id: tokenId } };
      const { token_uri } = await client.queryContractSmart(nftContractAddress, tokenUriQuery);
      
      // Replace ipfs:// with the IPFS gateway
      const ipfsUrl = token_uri.replace('ipfs://', ipfsGateway);
      
      const response = await fetch(ipfsUrl);
      const metadata = await response.json();
      console.log(metadata);
      
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
