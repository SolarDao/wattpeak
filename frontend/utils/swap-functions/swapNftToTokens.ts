import { SigningStargateClient } from "@cosmjs/stargate";
import { toast } from "react-toastify";

interface SwapNftToTokensParams {
  signingClient: SigningStargateClient | null;
  selectedNft: string | null;
  address: string | undefined;
  config: {
    price_per_nft: string;
    token_denom: string;
  };
  HERO_CONTRACT_ADDRESS: string | undefined;
  SWAP_CONTRACT_ADDRESS: string | undefined;
  queryNftsByAddress: (address: string) => Promise<any>;
  setWalletNfts: (nfts: any[]) => void;
  setContractNfts: (nfts: any[]) => void;
  setSelectedNft: (nft: string | null) => void;
  setModalIsOpen: (isOpen: boolean) => void;
  setError: (error: any) => void;
  setSwapping: (swapping: boolean) => void;
  walletNfts: any[];
}

export const swapNftToTokens = async ({
  signingClient,
  selectedNft,
  address,
  config,
  HERO_CONTRACT_ADDRESS,
  SWAP_CONTRACT_ADDRESS = "",
  queryNftsByAddress,
  setWalletNfts,
  setContractNfts,
  setSelectedNft,
  setModalIsOpen,
  setError,
  setSwapping,
  walletNfts,
}: SwapNftToTokensParams) => {
  if (!signingClient || !selectedNft) {
    console.error("Signing client or selected NFT not initialized");
    return;
  }

  try {
    setSwapping(true);

    const msgDetails = JSON.stringify({
      amount: config.price_per_nft,
      denom: config.token_denom,
    });
    const msgBase64 = btoa(msgDetails);
    const swapMsg = {
      send_nft: {
        contract: SWAP_CONTRACT_ADDRESS,
        token_id: selectedNft,
        msg: msgBase64,
      },
    };

    const result = await signingClient.execute(
      address, // Sender address
      HERO_CONTRACT_ADDRESS, // Swap Contract address
      swapMsg, // Swap message
      {
        amount: [{ denom: "ustars", amount: "7500" }], // fee
        gas: "300000", // gas limit
      }
    );
    console.log("Swap result:", result);

    setWalletNfts(walletNfts.filter((nft) => nft.tokenId !== selectedNft));
    const walletNftsResult = await queryNftsByAddress(address ?? "");
    setWalletNfts(walletNftsResult); // Adjust based on your query response structure

    const contractNftsResult = await queryNftsByAddress(
      SWAP_CONTRACT_ADDRESS
    );
    setContractNfts(contractNftsResult); // Adjust based on your query response structure

    setSelectedNft(null);
    setModalIsOpen(false);
    toast.success("NFT swapped successfully!");
  } catch (err) {
    setError(err as Error);
    toast.error("Error swapping NFT");
    console.error("Error executing swap:", err);
  } finally {
    setSwapping(false);
  }
};
