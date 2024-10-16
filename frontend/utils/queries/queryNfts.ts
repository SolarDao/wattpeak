// utils/queryNfts.js

export const queryNftsByAddress = async (address: string | undefined) => {
  if (!address) {
    throw new Error("Address is required");
  }

  const response = await fetch(
    `/api/queryNftsByAddress?address=${encodeURIComponent(address)}`, {
      cache: 'no-store',
    }
  );

  const data = await response.json();
  return data.nfts;
};

export const queryNftConfig = async () => {
  const response = await fetch("/api/queryNftConfig");

  if (!response.ok) {
    throw new Error(`Error fetching NFT config: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};
