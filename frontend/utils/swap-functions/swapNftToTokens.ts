import { SigningCosmWasmClient, MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { toUtf8 } from "@cosmjs/encoding";
import { Coin, coins } from "@cosmjs/stargate";
import { toast } from "react-toastify";

interface SwapNftToTokensParams {
  signingClient: SigningCosmWasmClient | null;
  selectedNft: string | null;
  address: string | undefined;
  config: {
    price_per_nft: string;
    token_denom: string;
    swap_fee_denom: string;
    swap_fee: string;
    swap_fee_address: string;
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
  if (!signingClient || !selectedNft || !address) {
    console.error("Signing client, selected NFT, or address not initialized");
    return;
  }

  try {
    setSwapping(true);

    // Prepare the send_nft message to transfer the NFT to the swap contract
    const msgDetails = JSON.stringify({
      amount: config.price_per_nft,
      denom: config.token_denom,
    });

    const msgBase64 = Buffer.from(msgDetails).toString("base64");
    const sendNftMsg = {
      send_nft: {
        contract: SWAP_CONTRACT_ADDRESS,
        token_id: selectedNft,
        msg: msgBase64,
      },
    };
    
    // Step 2: Prepare the swap fee message
    const swapFeeCoin: Coin = {
      denom: config.swap_fee_denom, // Correct denomination for swap fee
      amount: config.swap_fee,
    };

    // Assuming your smart contract expects a specific message to handle swap fees
    const swapFeeMsg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: {
        sender: address,
        contract: SWAP_CONTRACT_ADDRESS,
        msg: toUtf8(JSON.stringify({ receive_swap_fee: {
          amount_of_nft: "1",
        } })), 
        funds: [swapFeeCoin],
      },
    };

    // Create the execute contract message for send_nft
    const executeContractMsg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: {
        sender: address,
        contract: HERO_CONTRACT_ADDRESS,
        msg: toUtf8(JSON.stringify(sendNftMsg)),
        funds: [], // No funds are sent to the NFT contract
      },
    };

    // Combine the messages
    const messages = [ swapFeeMsg, executeContractMsg];

    // Estimate fee
    const fee = {
      amount: coins(7500, "ustars"), // Adjust fee as needed
      gas: "300000",
    };

    // Broadcast the transaction
    const result = await signingClient.signAndBroadcast(address, messages, fee);

    if (result.code !== 0) {
      throw new Error(`Transaction failed with code ${result.code}: ${result.rawLog}`);
    }

    // Update UI and state
    setWalletNfts(walletNfts.filter((nft) => nft.tokenId !== selectedNft));
    const walletNftsResult = await queryNftsByAddress(address);
    setWalletNfts(walletNftsResult);

    const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS);
    setContractNfts(contractNftsResult);

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
