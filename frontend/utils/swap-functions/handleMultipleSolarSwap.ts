import { SigningStargateClient } from "@cosmjs/stargate";
import { toast } from "react-toastify";
import { toUtf8 } from "@cosmjs/encoding";

interface HandleMultipleSolarSwapProps {
  signingClient: SigningStargateClient | null;
  selectedMultipleNfts: string[];
  address: string | undefined;
  config: { price_per_nft: string; token_denom: string };
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
  if (!signingClient || selectedMultipleNfts.length === 0) {
    console.error("Signing client or selected NFTs not initialized");
    return;
  }

  try {
    setSwapping(true);

    // Prepare all messages
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
          funds: [
            { denom: config.token_denom, amount: config.price_per_nft },
          ],
        },
      };
    });

    const fee = {
      amount: [{ denom: "ustars", amount: "7500" }],
      gas: (300000 * selectedMultipleNfts.length).toString(),
    };

    // Sign and broadcast the transaction
    const result = await signingClient.signAndBroadcast(address ?? "", msgs, fee);

    if (result.code !== 0) {
      throw new Error(`Error executing transaction: ${result.rawLog}`);
    }

    const walletNftsResult = await queryNftsByAddress(address || "");
    setWalletNfts(walletNftsResult);

    const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS || "");
    setContractNfts(contractNftsResult);

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
