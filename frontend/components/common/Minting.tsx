import React, { useEffect, useState } from 'react';
import { useChainWallet, useWallet } from '@cosmos-kit/react';
import { getCosmWasmClient } from "../../utils/junoSetup";
import { Box, Spinner } from '@interchain-ui/react'
import { setConfig } from 'next/config';


const nftContractAddress = process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS;

export async function queryNftConfig() {
  const client = await getCosmWasmClient();
  
  const queryMsg = { config: {} };
  
  const queryResult = await client.queryContractSmart(nftContractAddress, queryMsg);
  console.log("Query Result:", queryResult);
  setConfig(queryResult);
  
  return queryResult;
}

export const Minting = ({ chainName }) => {
  let wallet = useWallet();
  let walletName = wallet?.wallet?.name ?? '';

  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(chainName, walletName);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(1);
  const [price, setPrice] = useState("0");
  const [signingClient, setSigningClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  
  console.log(status, address, walletName, chainName, wallet, getSigningCosmWasmClient, connect);
  

  useEffect(() => {
    const fetchConfig = async () => {
      if (status === 'Connected') {
        try {
          const client = await getSigningCosmWasmClient();
          console.log('Client:', client);
          
          setSigningClient(client);

          queryNftConfig().then((result) => {
            setConfig(result);
          });

        } catch (err) {
          setError(err);
          console.error('Error querying the NFT contract:', err);
        } finally {
          setLoading(false);
        }
      } else {
        await connect();
        setLoading(false);
      }
    };

    fetchConfig();
  }, [status, getSigningCosmWasmClient, connect]);

  useEffect(() => {
    let payable_amount = (((amount + (amount * 0.05)) * 5) * 1000000).toString();
    setPrice(payable_amount);
    console.log('Payable amount:', payable_amount);
    
  }, [amount]);


  const handleMint = async () => {
    if (!signingClient) {
      console.error('Signing client not initialized');
      return;
    }
    setMinting(true);
  
    const mintMsg = {
      mint_tokens: {
        address: address, // User's address from Keplr
        amount: (amount * 1000000).toString(),// Adjust the amount as per the requirement
        project_id: 3, // Assuming project_id is fixed, update if dynamic
      },
    };
  
 try {
    const result = await signingClient.execute(
      address, // Sender address
      nftContractAddress, // Contract address
      mintMsg, // Execute message
      {
        amount: [{ denom: 'ujunox', amount: '7500' }], // fee
        gas: '3000000', // gas limit
      },
      '', // Optional memo
      [{ denom: 'ujunox', amount: price}] // Funds sent with transaction
    );
    console.log('Minting result:', result);
  } catch (err) {
    setError(err);
    console.error('Error executing mint:', err);
  } finally {
    setMinting(false);
  }
  };
  
  return (
    <div>
    <h1>NFT Contract Config</h1>
    {error && <p>Error: {error.message}</p>}
    {config ? (
      <pre>{JSON.stringify(config.minting_price.amount, null, 2)}</pre>
    ) : (
      <p>Loading config...</p>
    )}
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value))}
        min="1"
        placeholder="Amount to mint"
      />
      <button onClick={handleMint} disabled={minting}>
        {minting ? <Spinner size="sm" /> : 'Mint'}
      </button>
    </div>

    {(loading || minting) && (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        backgroundColor="rgba(0, 0, 0, 0.5)"
        zIndex="9999"
      >
        <Spinner size='lg' color="black" />
      </Box>
    )}
  </div>
  );
};

export default Minting;