import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const rpcEndpoint = process.env.NEXT_PUBLIC_STARGAZE_RPC_ENDPOINT; // Stargaze RPC endpoint
const nftContractAddress = process.env.NEXT_PUBLIC_SOLAR_HERO_CONTRACT_ADDRESS; // NFT contract address
const swapContractAddress = process.env.NEXT_PUBLIC_NFT_SWAPPER_CONTRACT_ADDRESS; // Swap contract address
const ipfsGateway = 'https://ipfs.io/ipfs/'; // You can replace this with any preferred IPFS gateway

export const queryNftsByAddress = async (address) => {
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
  return nfts;
};


export async function queryNftConfig() {
  const client = await CosmWasmClient.connect(rpcEndpoint);
  const queryMsg = { config: {} }; // Modify the query message as per the contract schema

  const queryResult = await client.queryContractSmart(swapContractAddress, queryMsg);
  console.log("Query Result:", queryResult);
  return queryResult;
}
