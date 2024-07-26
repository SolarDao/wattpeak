import { SigningStargateClient } from "@cosmjs/stargate";
import { toast } from "react-toastify";
import { toBase64, toUtf8 } from "@cosmjs/encoding";

interface HandleMultipleNftSwapProps {
  signingClient: SigningStargateClient | null;
  selectedMultipleNfts: string[];
  address: string | undefined;
  config: { price_per_nft: string; token_denom: string };
  HERO_CONTRACT_ADDRESS: string | undefined;
  SWAP_CONTRACT_ADDRESS: string | undefined;
  queryNftsByAddress: (address: string) => Promise<any[]>;
  setWalletNfts: (nfts: any[]) => void;
  setContractNfts: (nfts: any[]) => void;
  setSelectedMultipleNfts: (nfts: string[]) => void;
  setError: (error: any) => void;
  setSwapping: (swapping: boolean) => void;
}

export const handleMultipleNftSwapFunctionUtil = async ({
  signingClient,
  selectedMultipleNfts,
  address,
  config,
  HERO_CONTRACT_ADDRESS,
  SWAP_CONTRACT_ADDRESS,
  queryNftsByAddress,
  setWalletNfts,
  setContractNfts,
  setSelectedMultipleNfts,
  setError,
  setSwapping,
}: HandleMultipleNftSwapProps) => {
  if (!signingClient || selectedMultipleNfts.length === 0) {
    console.error("Signing client or selected NFTs not initialized");
    return;
  }

  try {
    setSwapping(true);

    // Prepare all messages
    const msgs = selectedMultipleNfts.map((tokenId) => {
      const msgDetails = {
        amount: config.price_per_nft,
        denom: config.token_denom,
      };
      const msgBase64 = toBase64(toUtf8(JSON.stringify(msgDetails)));

      return {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
          sender: address,
          contract: HERO_CONTRACT_ADDRESS,
          msg: toUtf8(
            JSON.stringify({
              send_nft: {
                contract: SWAP_CONTRACT_ADDRESS,
                token_id: tokenId,
                msg: msgBase64,
              },
            })
          ),
          funds: [],
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

    const walletNftsResult = await queryNftsByAddress(address ?? "");
    setWalletNfts(walletNftsResult);

    let contractNftsResult;
    if (SWAP_CONTRACT_ADDRESS) {
      contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS);
    } else {
      throw new Error("SWAP_CONTRACT_ADDRESS is undefined");
    }
    setContractNfts(contractNftsResult);

    setSelectedMultipleNfts([]);
    toast.success("NFTs successfully swapped!");
  } catch (err) {
    setError(err);
    toast.error("Error swapping NFTs");
    console.error("Error executing multiple swap:", err);
  } finally {
    setSwapping(false);
  }
};
