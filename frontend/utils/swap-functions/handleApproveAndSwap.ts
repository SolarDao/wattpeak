import { toUtf8 } from "@cosmjs/encoding";
import { toast } from "react-toastify";
import { queryNftsByAddress } from "@/utils/queries/queryNfts";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

export const handleApproveAndSwap = async ({
  signingClient,
  selectedNft,
  SWAP_CONTRACT_ADDRESS,
  HERO_CONTRACT_ADDRESS,
  address,
  config,
  setSwapping,
  setWalletNfts,
  setContractNfts,
  setSelectedNft,
  setModalIsOpen,
  setError,
}: {
  signingClient: SigningCosmWasmClient | null;
  selectedNft: string;
  SWAP_CONTRACT_ADDRESS: string;
  HERO_CONTRACT_ADDRESS: string;
  address: string;
  config: any; // Replace 'any' with the actual type of 'config'
  setSwapping: (swapping: boolean) => void;
  setWalletNfts: (nfts: any) => void; // Replace 'any' with the actual type of 'nfts'
  setContractNfts: (nfts: any) => void; // Replace 'any' with the actual type of 'nfts'
  setSelectedNft: (nft: any) => void; // Replace 'any' with the actual type of 'nft'
  setModalIsOpen: (isOpen: boolean) => void;
  setError: (error: any) => void; // Replace 'any' with the actual type of 'error'
}) => {
  if (!signingClient || !selectedNft) {
    console.error("Signing client or selected NFT not initialized");
    return;
  }

  try {
    setSwapping(true);

    // Prepare the messages array
    const msgs = [];

    // Query existing approval
    const approvalQueryMsg = {
      approval: {
        spender: SWAP_CONTRACT_ADDRESS,
        token_id: selectedNft,
      },
    };

    let approvalQueryResult;
    try {
      approvalQueryResult = await signingClient.queryContractSmart(
        HERO_CONTRACT_ADDRESS,
        approvalQueryMsg
      );
    } catch (error) {
      // If the query fails, assume approval is not granted
      approvalQueryResult = null;
    }

    // If approval is not granted or expired, add approval message
    if (!approvalQueryResult || !approvalQueryResult.approval) {
      const approveMsg = {
        approve: {
          spender: SWAP_CONTRACT_ADDRESS,
          token_id: selectedNft,
          expires: {
            at_time: ((Math.floor(Date.now() / 1000) + 3600) * 1e9).toString(), // Expires in 1 hour (nanoseconds)
          },
        },
      };

      msgs.push({
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
          sender: address,
          contract: HERO_CONTRACT_ADDRESS,
          msg: toUtf8(JSON.stringify(approveMsg)),
          funds: [],
        },
      });
    }

    // Add swap message (price_per_nft + swap_fee)
    const swapMsg = {
      swap_token: {
        nft_id: selectedNft,
      },
    };

    const amount = Number(config.price_per_nft) + Number(config.swap_fee);

    msgs.push({
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: {
        sender: address,
        contract: SWAP_CONTRACT_ADDRESS,
        msg: toUtf8(JSON.stringify(swapMsg)),
        // Provide the funds required for swap (price_per_nft and swap_fee)
        funds: [
          { denom: config.token_denom, amount: amount },
        ],
      },
    });

    const fee = {
      amount: [{ denom: "ustars", amount: "7500" }],
      gas: (200000 + 300000 + 80000).toString(), // Adjusted gas to include the extra message
    };

    // Sign and broadcast the transaction
    const result = await signingClient.signAndBroadcast(address, msgs, fee);

    if (result.code !== 0) {
      throw new Error(`Error executing transaction: ${result.rawLog}`);
    }

    // Update wallet and contract NFTs
    const walletNftsResult = await queryNftsByAddress(address);
    setWalletNfts(walletNftsResult);

    const contractNftsResult = await queryNftsByAddress(SWAP_CONTRACT_ADDRESS);
    setContractNfts(contractNftsResult);

    setSelectedNft(null);
    setModalIsOpen(false);
    toast.success("Tokens successfully swapped!");
  } catch (err) {
    setError(err);
    console.error("Error executing approve and swap:", err);
    toast.error("Error swapping tokens");
  } finally {
    setSwapping(false);
  }
};
