// src/utils/swapUtils.js
import { toUtf8 } from "@cosmjs/encoding";
import { toast } from "react-toastify";
import { queryNftsByAddress } from "@/utils/queryNfts";

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

    const approvalQueryResult = await signingClient.queryContractSmart(
      HERO_CONTRACT_ADDRESS,
      approvalQueryMsg
    );

    // If approval is not granted or expired, add approval message
    if (!approvalQueryResult || !approvalQueryResult.approval) {
      const approveMsg = {
        approve: {
          spender: SWAP_CONTRACT_ADDRESS,
          token_id: selectedNft,
          expires: { at_time: Math.floor(Date.now() / 1000) + 60 }, // Expires in 1 hour
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

    // Add swap message
    const swapMsg = {
      swap_token: {
        nft_id: selectedNft,
      },
    };

    msgs.push({
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: {
        sender: address,
        contract: SWAP_CONTRACT_ADDRESS,
        msg: toUtf8(JSON.stringify(swapMsg)),
        funds: [{ denom: config.token_denom, amount: config.price_per_nft }],
      },
    });

    const fee = {
      amount: [{ denom: "ustars", amount: "7500" }],
      gas: (200000 + 300000).toString(),
    };

    // Sign and broadcast the transaction
    const result = await signingClient.signAndBroadcast(address, msgs, fee);

    if (result.code !== 0) {
      throw new Error(`Error executing transaction: ${result.rawLog}`);
    }

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
