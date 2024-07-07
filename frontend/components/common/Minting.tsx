import React, { useEffect, useState } from 'react';
import { getCosmWasmClient } from "../../utils/stargazeSetup";

const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

export async function queryNftConfig() {
  const client = await getCosmWasmClient();
  
  const queryMsg = { config: {} };
  
  const queryResult = await client.queryContractSmart(nftContractAddress, queryMsg);
  console.log("Query Result:", queryResult);
  
  return queryResult;
}

export const Minting = () => {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const result = await queryNftConfig();
        setConfig(result);
      } catch (err) {
        setError(err);
        console.error("Error querying the NFT contract:", err);
      }
    };

    fetchConfig();
  }, []);

  return (
    <div>
      <h1>NFT Contract Config</h1>
      {error && <p>Error: {error.message}</p>}
      {config ? (
        <pre>{JSON.stringify(config, null, 2)}</pre>
      ) : (
        <p>Loading config...</p>
      )}
    </div>
  );
};
