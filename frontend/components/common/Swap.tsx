import React, { useEffect, useState } from "react";
import { queryNftsByAddress, queryNftConfig } from "../../utils/queryNfts";
import { useChain } from "@cosmos-kit/react";
import {
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Box,
  ListItem,
  UnorderedList,
  Heading,
} from "@chakra-ui/react";
import { Spinner, useColorModeValue } from "@interchain-ui/react";
import Image from "next/image";
import Modal from "react-modal";
import { handleApproveAndSwap } from "@/utils/swap-functions/handleApproveAndSwap";
import NftDetailsModal from "./SwapModal";
import MultipleSelectBox from "./MultipleSelectBox";
import { swapNftToTokens } from "@/utils/swap-functions/swapNftToTokens";
import { handleMultipleNftSwapFunctionUtil } from "@/utils/swap-functions/handleMultipleNftSwap";
import { handleMultipleSolarSwapUtilFunction } from "@/utils/swap-functions/handleMultipleSolarSwap";
import { Loading } from "./Loading";
import { useMediaQuery } from "react-responsive";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const HERO_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_SOLAR_HERO_CONTRACT_ADDRESS;
const SWAP_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_NFT_SWAPPER_CONTRACT_ADDRESS; // Adjust if different

// Set the app element for accessibility
Modal.setAppElement("#__next");

export const Swap = ({ chainName }: { chainName: string }) => {
  const { connect, status, address, getSigningCosmWasmClient, wallet } =
    useChain(chainName);
  interface Nft {
    name: string;
    image: any;
    tokenId: string;
  }

  const [walletNfts, setWalletNfts] = useState<Nft[]>([]);
  const [contractNfts, setContractNfts] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);  
  const [error, setError] = useState(null);
  const [signingClient, setSigningClient] =
    useState<SigningCosmWasmClient | null>(null);
  const [selectedNft, setSelectedNft] = useState<string | null>("");
  const [multipleSelect, setMultipleSelect] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const inputColor = useColorModeValue("#000000B2", "white");
  const borderColor = useColorModeValue("black", "white");
  const nftBackgroundColor = useColorModeValue("rgba(0, 0, 0, 0.07)", "black");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );
  const modalBackgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.07)",
    "rgba(35, 35, 35, 1)"
  );
  const [selectedNftDetails, setSelectedNftDetails] = useState<null | {
    tokenId: string;
  }>(null);
  const [selectedMultipleNfts, setSelectedMultipleNfts] = useState<string[]>(
    []
  );

  const [config, setConfig] = useState({
    price_per_nft: "5",
    token_denom: "ustars",
  });
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  useEffect(() => {
    const fetchNftsAndConfig = async () => {
      if (status === "Connected" && address && address.startsWith("stars")) {
        try {
          setLoading(true);
  
          // Start all fetch operations simultaneously
          const [client, walletNftsResult, contractNftsResult, configResult] = await Promise.all([
            getSigningCosmWasmClient(),
            queryNftsByAddress(address),
            queryNftsByAddress(SWAP_CONTRACT_ADDRESS),
            queryNftConfig(),
          ]);
  
          setSigningClient(client as unknown as SigningCosmWasmClient);
          setWalletNfts(walletNftsResult);
          setContractNfts(contractNftsResult);
          setConfig(configResult);
        } catch (err) {
          setError(err as React.SetStateAction<null>);
          console.error("Error fetching NFTs or configuration:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Wallet is not connected or address is not available
        setSigningClient(null);
        setWalletNfts([]);
        setContractNfts([]);
        setConfig({ price_per_nft: "5", token_denom: "ustars" }); // Reset to default or null
        setLoading(false);
      }
    };
  
    fetchNftsAndConfig();
  }, [status, address, getSigningCosmWasmClient]);
  
  

  useEffect(() => {
    const fetchClient = async () => {
      if (status === "Connected" && address) {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client as unknown as SigningCosmWasmClient);
        } catch (err) {
          setError(err as React.SetStateAction<null>);
          console.error("Error getting signing client:", err);
        }
      } else {
        // Wallet is not connected
        setSigningClient(null);
      }
    };
  
    fetchClient();
  }, [status, address, getSigningCosmWasmClient]);
  

  const handleNftClick = (nft: { tokenId: string }) => {
    if (multipleSelect) {
      setSelectedMultipleNfts((prevSelected) =>
        prevSelected.includes(nft.tokenId)
          ? prevSelected.filter((id) => id !== nft.tokenId)
          : [...prevSelected, nft.tokenId]
      );
    } else {
      setSelectedNft(nft.tokenId);
      setSelectedNftDetails(nft);
      setModalIsOpen(true);
    }
  };

  const handleSolarSwap = () => {
    handleApproveAndSwap({
      signingClient,
      selectedNft: selectedNft || "",
      SWAP_CONTRACT_ADDRESS: HERO_CONTRACT_ADDRESS || "",
      HERO_CONTRACT_ADDRESS: HERO_CONTRACT_ADDRESS || "",
      address: address || "",
      config,
      setSwapping,
      setWalletNfts,
      setContractNfts,
      setSelectedNft,
      setModalIsOpen,
      setError,
    });
  };

  const handleNftSwap = async () => {
    swapNftToTokens({
      signingClient,
      selectedNft,
      address,
      config,
      HERO_CONTRACT_ADDRESS,
      SWAP_CONTRACT_ADDRESS,
      queryNftsByAddress,
      setWalletNfts,
      setContractNfts,
      setSelectedNft,
      setModalIsOpen,
      setError,
      setSwapping,
      walletNfts,
    });
  };

  const handleMultipleNftSwap = async () => {
    handleMultipleNftSwapFunctionUtil({
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
    });
  };

  const handleMultipleSolarSwap = async () => {
    handleMultipleSolarSwapUtilFunction({
      signingClient: signingClient as unknown as SigningCosmWasmClient,
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
    });
  };

  const handleTabsChange = (index: React.SetStateAction<number>) => {
    setTabIndex(index);
    setSelectedNft(null);
    setSelectedNftDetails(null);
    setSelectedMultipleNfts([]);
  };

  if (loading || swapping) {
    return <Loading />;
  }
  return (
    <div>
      <Tabs index={tabIndex} onChange={handleTabsChange}>
        <Box className="swapTabsBox">
          {!isMobile && (
            <Heading
              fontSize="20px"
              textAlign="left"
              paddingLeft="15px"
              color={inputColor}
              marginBottom="5px"
            >
              Cyber Solar Heroes
            </Heading>
          )}
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
          {!isMobile && (
            <Button
              className="multipleSelectBtn"
              color={multipleSelect ? "black" : inputColor}
              borderColor={borderColor}
              onClick={() => setMultipleSelect(!multipleSelect)}
              background={
                multipleSelect
                  ? "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)"
                  : backgroundColor
              }
            >
              {inputColor === "white" && !multipleSelect ? (
                <Image
                  className="multipleSelectImg"
                  src={require("../../images/frame.png")}
                  alt={"multiple select"}
                  width={20}
                  height={20}
                ></Image>
              ) : (
                <Image
                  className="multipleSelectImg"
                  src={require("../../images/frame_black.png")}
                  alt={"multiple select"}
                  width={20}
                  height={20}
                />
              )}
              Select Multiple
            </Button>
          )}
        </Box>

        <TabPanels className="swapPanels" background={backgroundColor}>
          <TabPanel>
            {walletNfts.length === 0 ? (
              <Center height={500} fontSize={30}>
                {" "}
                No NFTs found in your wallet
              </Center>
            ) : (
              <UnorderedList className="nftList">
                {walletNfts.map((nft, index) => (
                  <ListItem
                    key={index}
                    className={`nft-item ${
                      multipleSelect &&
                      selectedMultipleNfts.includes(nft.tokenId)
                        ? "selected-nft"
                        : ""
                    }`}
                    background={nftBackgroundColor}
                    color={inputColor}
                    onClick={() => handleNftClick(nft)}
                  >
                    <Image
                      src={nft.image.replace(
                        "ipfs://",
                        process.env.NEXT_PUBLIC_IPFS_GATEWAY || ""
                      )}
                      alt={nft.name}
                      className="nftImage"
                      width={150}
                      height={150}
                    />
                    <p>Name: {nft.name}</p>
                  </ListItem>
                ))}
              </UnorderedList>
            )}
          </TabPanel>
          <TabPanel>
            {contractNfts.length === 0 ? (
              <Center height={500} fontSize={30}>
                {" "}
                No NFTs available in contract
              </Center>
            ) : (
              <UnorderedList className="nftList">
                {contractNfts.map((nft, index) => (
                  <ListItem
                    key={index}
                    className={`nft-item ${
                      multipleSelect &&
                      selectedMultipleNfts.includes(nft.tokenId)
                        ? "selected-nft"
                        : ""
                    }`}
                    background={nftBackgroundColor}
                    color={inputColor}
                    onClick={() => handleNftClick(nft)}
                  >
                    <Image
                      src={nft.image.replace(
                        "ipfs://",
                        process.env.NEXT_PUBLIC_IPFS_GATEWAY || ""
                      )}
                      alt={nft.name}
                      className="nftImage"
                      width={150}
                      height={150}
                    />
                    <p>Name: {nft.name}</p>
                  </ListItem>
                ))}
              </UnorderedList>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {multipleSelect && selectedMultipleNfts.length > 0 && (
        <MultipleSelectBox
          tabIndex={tabIndex}
          walletNfts={walletNfts}
          contractNfts={contractNfts}
          selectedMultipleNfts={selectedMultipleNfts}
          setSelectedMultipleNfts={setSelectedMultipleNfts}
          handleMultipleNftSwap={handleMultipleNftSwap}
          handleMultipleSolarSwap={handleMultipleSolarSwap}
          config={config}
        />
      )}

      {selectedNftDetails && !multipleSelect && (
        <NftDetailsModal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          selectedNftDetails={selectedNftDetails}
          config={config}
          tabIndex={tabIndex}
          swapping={swapping}
          swapNftToTokens={() => handleNftSwap()}
          handleSolarSwap={handleSolarSwap}
          inputColor={inputColor}
          modalBackgroundColor={modalBackgroundColor}
          color={""}
        />
      )}
    </div>
  );
};

export default Swap;
