import React, { useEffect, useState } from "react";
import { useWalletAddress } from "../../context/WalletAddressContext";
import { queryNftsByAddress, queryNftConfig } from "../../utils/queryNfts";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
import {
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Box,
} from "@chakra-ui/react";
import { Spinner, useColorModeValue } from "@interchain-ui/react";
import Image from "next/image";

const HERO_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_SOLAR_HERO_CONTRACT_ADDRESS;
const SWAP_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_NFT_SWAPPER_CONTRACT_ADDRESS; // Adjust if different

export const Swap = ({ chainName }) => {
  let wallet = useWallet();
  let walletName = wallet?.wallet?.name ?? "";

  const { walletAddress } = useWalletAddress();
  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(
    chainName,
    walletName
  );
  const [walletNfts, setWalletNfts] = useState([]);
  const [contractNfts, setContractNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingClient, setSigningClient] = useState(null);
  const [selectedNft, setSelectedNft] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [swappingToNft, setSwappingToNft] = useState(false);
  const [config, setConfig] = useState({
    price_per_nft: "0",
    token_denom: "ustars",
  });
  const inputColor = useColorModeValue("black", "white");
  const borderColor = useColorModeValue("black", "white");
  const nftBorderColor = useColorModeValue("black", "yellow");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );

  useEffect(() => {
    const fetchNfts = async () => {
      if (walletAddress.startsWith("stars")) {
        try {
          const walletNftsResult = await queryNftsByAddress(walletAddress);
          setWalletNfts(walletNftsResult); // Adjust based on your query response structure

          const contractNftsResult = await queryNftsByAddress(
            SWAP_CONTRACT_ADDRESS
          );
          setContractNfts(contractNftsResult); // Adjust based on your query response structure

          const configResult = await queryNftConfig();
          setConfig(configResult);

          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchNfts();
  }, [walletAddress]);

  useEffect(() => {
    const fetchClient = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client);
        } catch (err) {
          setError(err);
          console.error("Error getting signing client:", err);
        }
      } else {
        await connect();
      }
    };

    fetchClient();
  }, [status, getSigningCosmWasmClient, connect]);

  const swapNftToTokens = async () => {
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
        walletAddress, // Sender address
        HERO_CONTRACT_ADDRESS, // Swap Contract address
        swapMsg, // Swap message
        {
          amount: [{ denom: "ustars", amount: "7500" }], // fee
          gas: "300000", // gas limit
        }
      );
      setWalletNfts(walletNfts.filter((nft) => nft.tokenId !== selectedNft));
      const walletNftsResult = await queryNftsByAddress(walletAddress);
      setWalletNfts(walletNftsResult); // Adjust based on your query response structure

      const contractNftsResult = await queryNftsByAddress(
        SWAP_CONTRACT_ADDRESS
      );
      setContractNfts(contractNftsResult); // Adjust based on your query response structure

      setSelectedNft(null);
    } catch (err) {
      setError(err);
      console.error("Error executing swap:", err);
    } finally {
      setSwapping(false);
    }
  };

  const handleApproveAndSwap = async () => {
    if (!signingClient || !selectedNft) {
      console.error("Signing client or selected NFT not initialized");
      return;
    }

    try {
      setSwapping(true);

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

      // If approval is not granted or expired, grant approval
      if (!approvalQueryResult || !approvalQueryResult.approval) {
        const approveMsg = {
          approve: {
            spender: SWAP_CONTRACT_ADDRESS,
            token_id: selectedNft,
            expires: { at_time: Math.floor(Date.now() / 1000) + 60 }, // Expires in 1 hour
          },
        };

        const approveResult = await signingClient.execute(
          walletAddress, // Sender address
          HERO_CONTRACT_ADDRESS, // NFT Contract address
          approveMsg, // Approve message
          {
            amount: [{ denom: "ustars", amount: "7500" }], // fee
            gas: "200000", // gas limit
          }
        );
      }

      // Swap the NFT for tokens
      const swapMsg = {
        swap_token: {
          nft_id: selectedNft,
        },
      };

      const swapResult = await signingClient.execute(
        walletAddress, // Sender address
        SWAP_CONTRACT_ADDRESS, // Swap Contract address
        swapMsg, // Swap message
        {
          amount: [{ denom: "ustars", amount: "7500" }], // fee
          gas: "300000", // gas limit
        },
        "",
        [{ denom: config.token_denom, amount: config.price_per_nft }]
      );
      setWalletNfts(walletNfts.filter((nft) => nft.tokenId !== selectedNft));
      const walletNftsResult = await queryNftsByAddress(walletAddress);
      setWalletNfts(walletNftsResult); // Adjust based on your query response structure

      const contractNftsResult = await queryNftsByAddress(
        SWAP_CONTRACT_ADDRESS
      );
      setContractNfts(contractNftsResult); // Adjust based on your query response structure

      setSelectedNft(null);
    } catch (err) {
      setError(err);
      console.error("Error executing approve and swap:", err);
    } finally {
      setSwapping(false);
    }
  };

  if (loading) {
    return (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        backgroundColor="rgba(0, 0, 0, 0.5)"
        zIndex="9999"
      >
        <Spinner size="$10xl" color="white" />
      </Box>
    );
  }

  if (error) return <div>Error: {error.message}</div>;
  return (
    <div>
      <Tabs>
        <Box className="swapTabsBox">
          <h2>Cyber Solar Heroes</h2>
          <TabList>
            <Tab
              className="swapTabs"
              borderColor={borderColor}
              color={inputColor}
              background={backgroundColor}
              _selected={{
                background: "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
                color: "black",
                transform: "translateX(0px)",
                transition: "transform 0.3s ease",
                zIndex: 2,
              }}
            >
              Swap NFTs
            </Tab>
            <Tab
              className="swapTabs"
              borderColor={borderColor}
              color={inputColor}
              background={backgroundColor}
              _selected={{
                background: "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
                color: "black",
                transform: "translateX(0px)",
                transition: "transform 0.3s ease",
                zIndex: 2,
              }}
            >
              Swap Solar
            </Tab>
          </TabList>
          <p>select multiple</p>
        </Box>

        <TabPanels className="swapPanels" backgroundColor={backgroundColor}>
          <TabPanel>
            <ul className="nftList">
              {walletNfts.map((nft, index) => (
                <li
                  key={index}
                  className={`nft-item ${
                    selectedNft === nft.tokenId ? "selected-nft" : ""
                  }`}
                  borderColor={borderColor}
                  onClick={() => setSelectedNft(nft.tokenId)}
                >
                  <Image
                    src={nft.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                    alt={nft.name}
                    className="nftImage"
                    width={220}
                    height={220}
                  />
                  <p>Name: {nft.name}</p>
                </li>
              ))}
            </ul>
            {selectedNft && (
              <div>
                <h2>Selected NFT: {selectedNft}</h2>
                <Button onClick={swapNftToTokens} disabled={swapping}>
                  {swapping ? <Spinner /> : "Approve and Swap NFT for Tokens"}
                </Button>
              </div>
            )}
          </TabPanel>
          <TabPanel>
            <ul className="nftList">
              {contractNfts.map((nft, index) => (
                <li
                  key={index}
                  className={`nft-item ${
                    selectedNft === nft.tokenId ? "selected-nft" : ""
                  }`}
                  onClick={() => setSelectedNft(nft.tokenId)}
                >
                  <Image
                    src={nft.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                    alt={nft.name}
                    className="nftImage"
                    width={220}
                    height={220}
                  />
                  <p>Name: {nft.name}</p>
                </li>
              ))}
            </ul>
            {selectedNft && (
              <div>
                <h2>Selected NFT: {selectedNft}</h2>
                <Button onClick={handleApproveAndSwap} disabled={swappingToNft}>
                  {swappingToNft ? <Spinner /> : "Swap Tokens for NFT"}
                </Button>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error.message}
        </Alert>
      )}
    </div>
  );
};

export default Swap;
