import React, { useEffect, useState } from 'react';
import { useWalletAddress } from '../../context/WalletAddressContext';
import { queryNftsByAddress, queryNftConfig } from '../../utils/queryNfts';
import { useChainWallet, useWallet } from '@cosmos-kit/react';
import { Spinner, Alert, AlertIcon, Tabs, TabList, TabPanels, Tab, TabPanel, Button, Input } from '@chakra-ui/react';
import { toBase64 } from '@cosmjs/encoding';

const HERO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SOLAR_HERO_CONTRACT_ADDRESS;
const SWAP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_SWAPPER_CONTRACT_ADDRESS; // Adjust if different

export const Swap = ({ chainName }) => {
  let wallet = useWallet();
  let walletName = wallet?.wallet?.name ?? "";

  const { walletAddress } = useWalletAddress();
  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(chainName, walletName);
  const [walletNfts, setWalletNfts] = useState([]);
  const [contractNfts, setContractNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingClient, setSigningClient] = useState(null);
  const [selectedNft, setSelectedNft] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [swappingToNft, setSwappingToNft] = useState(false);
  const [config, setConfig] = useState({ price_per_nft: '0', token_denom: 'ustars' });

  useEffect(() => {
    const fetchNfts = async () => {
      if (walletAddress.startsWith('stars')) {
        try {
          const walletNftsResult = await queryNftsByAddress(walletAddress);
          setWalletNfts(walletNftsResult.tokens || []); // Adjust based on your query response structure

          const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS);
          setContractNfts(contractNftsResult.tokens || []); // Adjust based on your query response structure

          const configResult = await queryNftConfig();
          setConfig(configResult);
          
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchNfts();
  }, [walletAddress]);

  useEffect(() => {
    const fetchClient = async () => {
      if (status === 'Connected') {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client);
        } catch (err) {
          setError(err);
          console.error('Error getting signing client:', err);
        }
      } else {
        await connect();
      }
    };

    fetchClient();
  }, [status, getSigningCosmWasmClient, connect]);

  const swapNftToTokens = async () => {
    if (!signingClient || !selectedNft) {
      console.error('Signing client or selected NFT not initialized');
      return;
    }

    try {
      setSwapping(true);
      
      const msgDetails = JSON.stringify({ amount: config.price_per_nft, denom: config.token_denom });
      const msgBase64 = btoa(msgDetails);
      const swapMsg = {
        send_nft: {
          contract: SWAP_CONTRACT_ADDRESS,
          token_id: selectedNft,
          msg: msgBase64,
        },
      };

      const result = await signingClient.execute(
        walletAddress, // Sender address
        HERO_CONTRACT_ADDRESS, // Swap Contract address
        swapMsg, // Swap message
        {
          amount: [{ denom: 'ustars', amount: '7500' }], // fee
          gas: '300000', // gas limit
        },
      );
      console.log('Swap result:', result);
      setWalletNfts(walletNfts.filter((nft) => nft !== selectedNft));
      const walletNftsResult = await queryNftsByAddress(walletAddress);
      setWalletNfts(walletNftsResult.tokens || []); // Adjust based on your query response structure

      const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS);
      setContractNfts(contractNftsResult.tokens || []); // Adjust based on your query response structure

      setSelectedNft(null);
    } catch (err) {
      setError(err);
      console.error('Error executing swap:', err);
    } finally {
      setSwapping(false);
    }
  };
  const handleApproveAndSwap = async () => {
    if (!signingClient || !selectedNft) {
      console.error('Signing client or selected NFT not initialized');
      return;
    }
  
    try {
      setSwapping(true);
  
      // Query existing approval
      const approvalQueryMsg = {
        approval: {
          spender: SWAP_CONTRACT_ADDRESS,
          token_id: selectedNft,
        },
      };
      
      const approvalQueryResult = await signingClient.queryContractSmart(
        HERO_CONTRACT_ADDRESS,
        approvalQueryMsg
      );
      
      console.log('Approval Query Result:', approvalQueryResult);
  
      // If approval is not granted or expired, grant approval
      if (!approvalQueryResult || !approvalQueryResult.approval) {
        const approveMsg = {
          approve: {
            spender: SWAP_CONTRACT_ADDRESS,
            token_id: selectedNft,
            expires: { at_time: Math.floor(Date.now() / 1000) + 60 }, // Expires in 1 hour
          },
        };
        console.log('Approve Message:', approveMsg);
  
        const approveResult = await signingClient.execute(
          walletAddress, // Sender address
          HERO_CONTRACT_ADDRESS, // NFT Contract address
          approveMsg, // Approve message
          {
            amount: [{ denom: 'ustars', amount: '7500' }], // fee
            gas: '200000', // gas limit
          }
        );
        console.log('Approve result:', approveResult);
      }
  
      // Swap the NFT for tokens
      const swapMsg = {
        swap_token: {
          nft_id: selectedNft,
        },
      };
  
      const swapResult = await signingClient.execute(
        walletAddress, // Sender address
        SWAP_CONTRACT_ADDRESS, // Swap Contract address
        swapMsg, // Swap message
        {
          amount: [{ denom: 'ustars', amount: '7500' }], // fee
          gas: '300000', // gas limit
        },
        "",
        [{ denom: config.token_denom, amount: config.price_per_nft }]
      );
      console.log('Swap result:', swapResult);
      setWalletNfts(walletNfts.filter((nft) => nft !== selectedNft));
      const walletNftsResult = await queryNftsByAddress(walletAddress);
      setWalletNfts(walletNftsResult.tokens || []); // Adjust based on your query response structure

      const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS);
      setContractNfts(contractNftsResult.tokens || []); // Adjust based on your query response structure
      
      setSelectedNft(null);
    } catch (err) {
      setError(err);
      console.error('Error executing approve and swap:', err);
    } finally {
      setSwapping(false);
    }
  };
  

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>NFT Swap</h1>
      <Tabs>
        <TabList>
          <Tab>Swap NFT to Tokens</Tab>
          <Tab>Swap Tokens to NFT</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <h1>NFTs Owned by {walletAddress}</h1>
            <ul>
              {walletNfts.map((nft, index) => (
                <li key={index}>
                  <p>Token ID: {nft}</p>
                  <button onClick={() => setSelectedNft(nft)}>Select for Swap</button>
                </li>
              ))}
            </ul>
            {selectedNft && (
              <div>
                <h2>Selected NFT: {selectedNft}</h2>
                <button onClick={swapNftToTokens} disabled={swapping}>
                  {swapping ? <Spinner /> : 'Approve and Swap NFT for Tokens'}
                </button>
              </div>
            )}
          </TabPanel>
          <TabPanel>
            <h1>NFTs Available for Swap</h1>
            <ul>
              {contractNfts.map((nft, index) => (
                <li key={index}>
                  <p>Token ID: {nft}</p>
                  <button onClick={() => setSelectedNft(nft)}>Select for Swap</button>
                </li>
              ))}
            </ul>
            {selectedNft && (
              <div>
                <h2>Selected NFT: {selectedNft}</h2>
                <Button onClick={handleApproveAndSwap} disabled={swappingToNft}>
                  {swappingToNft ? <Spinner /> : 'Swap Tokens for NFT'}
                </Button>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      {error && <Alert status="error"><AlertIcon />{error.message}</Alert>}
    </div>
  );
};

export default Swap;
