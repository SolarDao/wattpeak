import { MsgExecuteContractEncodeObject, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { coins, Coin } from "@cosmjs/stargate";
import { toast } from "react-toastify";
import { toBase64, toUtf8 } from "@cosmjs/encoding";

interface HandleMultipleNftSwapProps {
  signingClient: SigningCosmWasmClient | null;
  selectedMultipleNfts: string[];
  address: string | undefined;
  config: {
    price_per_nft: string;
    token_denom: string;
    swap_fee: string;
    swap_fee_denom: string;
  };
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
  // Validation Checks
  if (
    !signingClient ||
    selectedMultipleNfts.length === 0 ||
    !address ||
    !HERO_CONTRACT_ADDRESS ||
    !SWAP_CONTRACT_ADDRESS
  ) {
    console.error("Signing client, selected NFTs, address, or contract addresses not initialized");
    toast.error("Initialization error: Please ensure all parameters are set.");
    return;
  }

  try {
    setSwapping(true);

    // Step 1: Calculate total swap fee
    const totalSwapFeeAmount = (BigInt(config.swap_fee) * BigInt(selectedMultipleNfts.length)).toString();

    // Step 2: Prepare the swap fee message
    const swapFeeCoin: Coin = {
      denom: config.swap_fee_denom, // Correct denomination for swap fee
      amount: totalSwapFeeAmount,
    };

    // Assuming your smart contract expects a specific message to handle swap fees
    const swapFeeMsg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: {
        sender: address,
        contract: SWAP_CONTRACT_ADDRESS,
        msg: toUtf8(JSON.stringify({ receive_swap_fee: {} })), // Adjust based on your contract's expected message
        funds: [swapFeeCoin],
      },
    };

    // Step 3: Prepare all send_nft messages
    const sendNftMsgs: MsgExecuteContractEncodeObject[] = selectedMultipleNfts.map((tokenId) => {
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
          funds: [], // No funds are sent to the NFT contract
        },
      };
    });

    // Step 4: Combine the messages with swap fee first
    const messages: MsgExecuteContractEncodeObject[] = [swapFeeMsg, ...sendNftMsgs];

    // Step 5: Define the transaction fee
    const fee = {
      amount: coins(7500, config.swap_fee_denom), // Adjust fee based on network requirements
      gas: (300000 * selectedMultipleNfts.length + 80000).toString(), // Adjust gas limit as necessary
    };

    // Step 6: Broadcast the transaction
    const result = await signingClient.signAndBroadcast(address, messages, fee);

    // Step 7: Check transaction result
    if (result.code !== 0) {
      throw new Error(`Transaction failed with code ${result.code}: ${result.rawLog}`);
    }

    // Step 8: Update wallet and contract NFTs
    const walletNftsResult = await queryNftsByAddress(address);
    setWalletNfts(walletNftsResult);

    const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS);
    setContractNfts(contractNftsResult);

    // Step 9: Reset selected NFTs and display success message
    setSelectedMultipleNfts([]);
    toast.success("NFTs successfully swapped!");
  } catch (err) {
    // Handle errors and notify the user
    setError(err);
    toast.error("Error swapping NFTs");
    console.error("Error executing multiple swap:", err);
  } finally {
    // Reset swapping state regardless of success or failure
    setSwapping(false);
  }
};
