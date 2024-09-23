import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_STARGAZE_RPC_ENDPOINT || '';
const nftContractAddress = process.env.NEXT_PUBLIC_SOLAR_HERO_CONTRACT_ADDRESS || '';
const swapContractAddress = process.env.NEXT_PUBLIC_NFT_SWAPPER_CONTRACT_ADDRESS || ''; 
const ipfsGateway = 'https://ipfs.io/ipfs/'; 

export const queryNftsByAddress = async (address: string | undefined) => {
  const client = await CosmWasmClient.connect(rpcEndpoint);

  const tokensQuery = { tokens: { owner: address } };
  const { tokens } = await client.queryContractSmart(nftContractAddress, tokensQuery);

  const metadataPromises = tokens.map(async (tokenId: string) => {
    const tokenUriQuery = { nft_info: { token_id: tokenId } };
    const { token_uri } = await client.queryContractSmart(nftContractAddress, tokenUriQuery);
    
    // Replace ipfs:// with the IPFS gateway
    const ipfsUrl = token_uri.replace('ipfs://', ipfsGateway);
    
    const response = await fetch(ipfsUrl, {
      method: 'GET',
      mode: 'no-cors', // Set the mode to no-cors
    });
    
    try {
      // Response is opaque, so you can't access most details if using 'no-cors'
      const metadata = await response.json();
      return {
        tokenId,
        ...metadata,
      };
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return { tokenId, error: 'Failed to fetch metadata' };
    }
  });

  const nfts = await Promise.all(metadataPromises);
  return nfts;
};

export async function queryNftConfig() {
  const client = await CosmWasmClient.connect(rpcEndpoint);
  const queryMsg = { config: {} }; // Modify the query message as per the contract schema

  const queryResult = await client.queryContractSmart(swapContractAddress, queryMsg);
  return queryResult;
}