import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { toast } from "react-toastify";
import { toUtf8 } from "@cosmjs/encoding";

interface HandleMultipleSolarSwapProps {
  signingClient: SigningCosmWasmClient | null;
  selectedMultipleNfts: string[];
  address: string | undefined;
  config: {
    price_per_nft: string;
    token_denom: string;
    swap_fee: string;
    swap_fee_denom: string;
  };
  SWAP_CONTRACT_ADDRESS: string | undefined;
  HERO_CONTRACT_ADDRESS: string | undefined;
  queryNftsByAddress: (address: string) => Promise<any[]>;
  setWalletNfts: (nfts: any[]) => void;
  setContractNfts: (nfts: any[]) => void;
  setSelectedMultipleNfts: (nfts: string[]) => void;
  setError: (error: any) => void;
  setSwapping: (swapping: boolean) => void;
}

export const handleMultipleSolarSwapUtilFunction = async ({
  signingClient,
  selectedMultipleNfts,
  address,
  config,
  SWAP_CONTRACT_ADDRESS,
  queryNftsByAddress,
  setWalletNfts,
  setContractNfts,
  setSelectedMultipleNfts,
  setError,
  setSwapping,
}: HandleMultipleSolarSwapProps) => {
  if (!signingClient || selectedMultipleNfts.length === 0 || !address) {
    console.error("Signing client, address, or selected NFTs not initialized");
    return;
  }

  try {
    setSwapping(true);

    const totalAmount = Number(config.price_per_nft) + Number(config.swap_fee);

    // Prepare all swap messages
    const msgs = selectedMultipleNfts.map((tokenId) => {
      const swapMsg = {
        swap_token: {
          nft_id: tokenId,
        },
      };

      return {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
          sender: address,
          contract: SWAP_CONTRACT_ADDRESS,
          msg: toUtf8(JSON.stringify(swapMsg)),
          funds: [{ denom: config.token_denom, amount: totalAmount.toString() }], 
        },
      };
    });

    // Adjust the gas estimate to account for the additional message
    const fee = {
      amount: [{ denom: "ustars", amount: "7500" }],
      gas: (300000 * selectedMultipleNfts.length + 80000).toString(), // Added 80,000 gas for the swap fee transaction
    };

    // Sign and broadcast the transaction
    const result = await signingClient.signAndBroadcast(address, msgs, fee);

    if (result.code !== 0) {
      throw new Error(`Error executing transaction: ${result.rawLog}`);
    }

    // Update wallet and contract NFTs
    const walletNftsResult = await queryNftsByAddress(address);
    setWalletNfts(walletNftsResult);

    const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS || "");
    setContractNfts(contractNftsResult);

    // Reset selected NFTs and display success message
    setSelectedMultipleNfts([]);
    toast.success("Tokens swapped successfully!");
  } catch (err) {
    setError(err);
    toast.error("Error swapping tokens");
    console.error("Error executing multiple swap:", err);
  } finally {
    setSwapping(false);
  }
};
