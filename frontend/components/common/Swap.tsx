import React, { useEffect, useState } from "react";
import { queryNftsByAddress, queryNftConfig } from "../../utils/queryNfts";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
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

const HERO_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_SOLAR_HERO_CONTRACT_ADDRESS;
const SWAP_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_NFT_SWAPPER_CONTRACT_ADDRESS; // Adjust if different

// Set the app element for accessibility
Modal.setAppElement("#__next");

export const Swap = ({ chainName }: { chainName: string }) => {
  let wallet = useWallet();
  let walletName = wallet?.wallet?.name ?? "";

  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(
    chainName,
    walletName
  );
  interface Nft {
    name: string;
    image: any;
    tokenId: string;
  }

  const [walletNfts, setWalletNfts] = useState<Nft[]>([]);
  const [contractNfts, setContractNfts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingClient, setSigningClient] = useState(null);
  const [selectedNft, setSelectedNft] = useState<string | null>(null);
  const [multipleSelect, setMultipleSelect] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const inputColor = useColorModeValue("black", "white");
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

  useEffect(() => {
    const fetchNfts = async () => {
      if (status === "Connected" && (address ?? "").startsWith("stars")) {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client);

          const walletNftsResult = await queryNftsByAddress(address);
          setWalletNfts(walletNftsResult); // Adjust based on your query response structure

          const contractNftsResult = await queryNftsByAddress(
            SWAP_CONTRACT_ADDRESS
          );
          setContractNfts(contractNftsResult); // Adjust based on your query response structure

          const configResult = await queryNftConfig();
          setConfig(configResult);

          setLoading(false);
        } catch (err) {
          setError(err as React.SetStateAction<null>);
          console.error("Error fetching NFTs or configuration:", err);
          setLoading(false);
        }
      }
    };

    fetchNfts();
  }, [status, address, getSigningCosmWasmClient]);

  useEffect(() => {
    const fetchClient = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client);
        } catch (err) {
          setError(err as React.SetStateAction<null>);
          console.error("Error getting signing client:", err);
        }
      } else {
        await connect();
      }
    };

    fetchClient();
  }, [status, getSigningCosmWasmClient, connect]);

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
    handleMultipleNftSwapFunctionUtil ({
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
    })
  }

  const handleMultipleSolarSwap = async () => {
    handleMultipleSolarSwapUtilFunction({
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
  }

  const handleTabsChange = (index: React.SetStateAction<number>) => {
    setTabIndex(index);
    setSelectedNft(null);
    setSelectedNftDetails(null);
    setSelectedMultipleNfts([]);
  };

  if (loading || swapping) {
    return (
      <Loading/>
    );
  }
  return (
    <div>
      <Tabs index={tabIndex} onChange={handleTabsChange}>
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
                        "https://ipfs.io/ipfs/"
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
                        "https://ipfs.io/ipfs/"
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
