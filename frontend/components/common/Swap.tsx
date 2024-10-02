import React, { useEffect, useState } from "react";
import { queryNftsByAddress, queryNftConfig } from "../../utils/queries/queryNfts";
import { useChain } from "@cosmos-kit/react";
import {
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
  Link,
  Flex,
} from "@chakra-ui/react";
import { useColorModeValue } from "@interchain-ui/react";
import Image from "next/image";
import Modal from "react-modal";
import { handleApproveAndSwap } from "@/utils/swap-functions/handleApproveAndSwap";
import NftDetailsModal from "./helpers/SwapModal";
import MultipleSelectBox from "./helpers/MultipleSelectBox";
import { swapNftToTokens } from "@/utils/swap-functions/swapNftToTokens";
import { handleMultipleNftSwapFunctionUtil } from "@/utils/swap-functions/handleMultipleNftSwap";
import { handleMultipleSolarSwapUtilFunction } from "@/utils/swap-functions/handleMultipleSolarSwap";
import { Loading } from "./helpers/Loading";
import { useMediaQuery } from "react-responsive";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { ExternalLinkIcon } from "@chakra-ui/icons";

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
  const [ustarsBalance, setUstarsBalance] = useState<string>("0");
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

          const client = await getSigningCosmWasmClient();
          setSigningClient(client as unknown as SigningCosmWasmClient);

          // Fetch balance of ustars
          const balanceResult = await client.getBalance(address, "ustars");
          setUstarsBalance(balanceResult.amount);

          // Start fetch operations simultaneously after client is ready
          const [walletNftsResult, contractNftsResult, configResult] =
            await Promise.all([
              queryNftsByAddress(address),
              queryNftsByAddress(SWAP_CONTRACT_ADDRESS),
              queryNftConfig(),
            ]);

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

  const fetchUstarsBalance = async () => {
    if (signingClient && address) {
      try {
        const balanceResult = await signingClient.getBalance(address, "ustars");
        setUstarsBalance(balanceResult.amount);
      } catch (error) {
        console.error("Error fetching ustars balance:", error);
      }
    }
  };

  const formatUstars = (amount: string): string => {
    const amountNum = parseInt(amount, 10);
    return (amountNum / 1_000_000).toFixed(6); // Adjust decimals as needed
  };

  useEffect(() => {
    if (!swapping && status === "Connected" && address) {
      fetchUstarsBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapping]);

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
      SWAP_CONTRACT_ADDRESS: SWAP_CONTRACT_ADDRESS || "",
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
            <Box>
              <Heading
                fontSize="20px"
                textAlign="left"
                paddingLeft="15px"
                color={inputColor}
                marginBottom="5px"
              >
                Cyber Solar Heroes
              </Heading>
              <Box>
                {address && (
                  <Box fontSize="12px" textAlign="center">
                    <Box color={inputColor}>
                      Solar balance: {formatUstars(ustarsBalance)}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          <TabList marginLeft="42px">
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
              <Box
                display="flex"
                flexDirection="column"
                gap="10px"
                height={500}
                justifyContent="center"
                alignItems="center"
              >
                <Box fontSize={30} marginBottom="30px" textAlign="center">
                  {" "}
                  No NFTs found in Wallet
                </Box>
                <Box textAlign="center" fontSize="20px">
                  Swap Solar Tokens for Cyber Solar Heroes{" "}
                  <Link
                    onClick={() => setTabIndex(1)}
                    color="blue.500"
                    textDecoration="underline"
                    cursor="pointer"
                    _hover={{
                      color: "purple",
                    }}
                  >
                    here
                  </Link>{" "}
                  <br />
                  or trade on{" "}
                  <Link
                    isExternal
                    textDecoration="underline"
                    href="https://www.stargaze.zone/m/stars1jxdssrjmuqxhrrajw4rlcdsmhf0drjf5kl4mdp339vng6lesd62s4uqy9q/tokens"
                    _hover={{
                      color: "purple",
                    }}
                  >
                    Stargaze <ExternalLinkIcon mx="2px" />
                  </Link>
                  <Box textAlign="center" marginTop="20px">
                    Trade Solar tokens on{" "}
                    <Link
                      isExternal
                      textDecoration="underline"
                      href="https://app.osmosis.zone/?from=USDT&sellOpen=false&buyOpen=false&to=SOLAR"
                      _hover={{
                        color: "purple",
                      }}
                    >
                      Osmosis <ExternalLinkIcon mx="2px" />
                    </Link>
                  </Box>
                </Box>
              </Box>
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
                      src={`/api/image-proxy?ipfsPath=${encodeURIComponent(
                        nft.image.replace("ipfs://", "")
                      )}`}
                      alt={nft.name}
                      className="nftImage"
                      width={150}
                      height={150}
                    />
                    <p>{nft.name}</p>
                  </ListItem>
                ))}
              </UnorderedList>
            )}
          </TabPanel>
          <TabPanel>
            {contractNfts.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                gap="10px"
                height={500}
                justifyContent="center"
                alignItems="center"
              >
                <Box fontSize={30} marginBottom="30px" textAlign="center">
                  {" "}
                  No NFTs available in contract
                </Box>
                <Box textAlign="center" fontSize="20px">
                  Trade Cyber Solar Heroes on{" "}
                  <Link
                    isExternal
                    textDecoration="underline"
                    href="https://www.stargaze.zone/m/stars1jxdssrjmuqxhrrajw4rlcdsmhf0drjf5kl4mdp339vng6lesd62s4uqy9q/tokens"
                    _hover={{
                      color: "purple",
                    }}
                  >
                    Stargaze <ExternalLinkIcon mx="2px" />
                  </Link>
                  <br />
                  or Solar tokens on{" "}
                  <Link
                    isExternal
                    textDecoration="underline"
                    href="https://app.osmosis.zone/?from=USDT&sellOpen=false&buyOpen=false&to=SOLAR"
                    _hover={{
                      color: "purple",
                    }}
                  >
                    Osmosis <ExternalLinkIcon mx="2px" />
                  </Link>
                </Box>
              </Box>
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
                      src={`/api/image-proxy?ipfsPath=${encodeURIComponent(
                        nft.image.replace("ipfs://", "")
                      )}`}
                      alt={nft.name}
                      className="nftImage"
                      width={150}
                      height={150}
                    />
                    <p>{nft.name}</p>
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
