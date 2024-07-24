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
import { CloseIcon } from "@chakra-ui/icons";
import { toUtf8, toBase64 } from "@cosmjs/encoding";
import { toast } from 'react-toastify';

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
  const [walletNfts, setWalletNfts] = useState([]);
  const [contractNfts, setContractNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingClient, setSigningClient] = useState(null);
  const [selectedNft, setSelectedNft] = useState(null);
  const [selectedNftDetails, setSelectedNftDetails] = useState(null);
  const [selectedMultipleNfts, setSelectedMultipleNfts] = useState([]);
  const [multipleSelect, setMultipleSelect] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [config, setConfig] = useState({
    price_per_nft: "0",
    token_denom: "ustars",
  });
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

  useEffect(() => {
    const fetchNfts = async () => {
      if (address.startsWith("stars")) {
        try {
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
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchNfts();
  }, [address]);

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

  const handleNftClick = (nft) => {
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
        address, // Sender address
        HERO_CONTRACT_ADDRESS, // Swap Contract address
        swapMsg, // Swap message
        {
          amount: [{ denom: "ustars", amount: "7500" }], // fee
          gas: "300000", // gas limit
        }
      );
      setWalletNfts(walletNfts.filter((nft) => nft.tokenId !== selectedNft));
      const walletNftsResult = await queryNftsByAddress(address);
      setWalletNfts(walletNftsResult); // Adjust based on your query response structure

      const contractNftsResult = await queryNftsByAddress(
        SWAP_CONTRACT_ADDRESS
      );
      setContractNfts(contractNftsResult); // Adjust based on your query response structure

      setSelectedNft(null);
      setModalIsOpen(false);
      toast.success("NFT swapped succesfully!")
    } catch (err) {
      setError(err);
      toast.error("Error swapping NFT")
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
      const result = await signingClient.signAndBroadcast(
        address,
        msgs,
        fee
      );

      if (result.code !== 0) {
        throw new Error(`Error executing transaction: ${result.rawLog}`);
      }

      const walletNftsResult = await queryNftsByAddress(address);
      setWalletNfts(walletNftsResult);

      const contractNftsResult = await queryNftsByAddress(
        SWAP_CONTRACT_ADDRESS
      );
      setContractNfts(contractNftsResult);

      setSelectedNft(null);
      setModalIsOpen(false);
      toast.success("Tokens successfully swapped!")
    } catch (err) {
      setError(err);
      console.error("Error executing approve and swap:", err);
      toast.error("Error swapping tokens")
    } finally {
      setSwapping(false);
    }
  };

  const handleMultipleNftSwap = async () => {
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
      const result = await signingClient.signAndBroadcast(
        address,
        msgs,
        fee
      );

      if (result.code !== 0) {
        throw new Error(`Error executing transaction: ${result.rawLog}`);
      }

      const walletNftsResult = await queryNftsByAddress(address);
      setWalletNfts(walletNftsResult);

      const contractNftsResult = await queryNftsByAddress(
        SWAP_CONTRACT_ADDRESS
      );
      setContractNfts(contractNftsResult);

      setSelectedMultipleNfts([]);
      toast.success("NFTs successfully swapped!")
    } catch (err) {
      setError(err);
      toast.error("Error swapping NFTs")
      console.error("Error executing multiple swap:", err);
    } finally {
      setSwapping(false);
    }
  };

  const handleMultipleSolarSwap = async () => {
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
      const result = await signingClient.signAndBroadcast(
        address,
        msgs,
        fee
      );

      if (result.code !== 0) {
        throw new Error(`Error executing transaction: ${result.rawLog}`);
      }

      const walletNftsResult = await queryNftsByAddress(address);
      setWalletNfts(walletNftsResult);

      const contractNftsResult = await queryNftsByAddress(
        SWAP_CONTRACT_ADDRESS
      );
      setContractNfts(contractNftsResult);

      setSelectedMultipleNfts([]);
      toast.success("Tokens swapped successfully!")
    } catch (err) {
      setError(err);
      toast.error("Error swapping tokens")
      console.error("Error executing multiple swap:", err);
    } finally {
      setSwapping(false);
    }
  };

  const handleTabsChange = (index) => {
    setTabIndex(index);
    setSelectedNft(null);
    setSelectedNftDetails(null);
    setSelectedMultipleNfts([]);
  };

  const customStyles = {
    content: {
      top: "52%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      backgroundColor: useColorModeValue("white", "rgba(52, 52, 52, 1)"),
      color: useColorModeValue("black", "white"),
      borderRadius: "15px",
      height: "76%",
      width: "23%",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
    },
  };

  if (loading || swapping) {
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
        <Box
          className="selectedNftBox"
          background={backgroundColor}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          gap={10}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={10}
          >
            <Box display="flex" gap={25} alignItems="center">
              {(tabIndex === 0 ? walletNfts : contractNfts)
                .filter((nft) => selectedMultipleNfts.includes(nft.tokenId))
                .map((nft) => (
                  <Box
                    key={nft.tokenId}
                    width={30}
                    height={30}
                    position="relative"
                  >
                    <Image
                      src={nft.image.replace(
                        "ipfs://",
                        "https://ipfs.io/ipfs/"
                      )}
                      alt={nft.name}
                      width={50}
                      height={50}
                      style={{ borderRadius: "10px", display: "flex", gap: 2 }}
                    />
                  </Box>
                ))}
            </Box>
            <Button
              onClick={() => setSelectedMultipleNfts([])}
              background="linear-gradient(180deg, #FFD602 0%, #FFA231 100%)"
              color="black"
              borderRadius={50}
              padding={10}
              width={70}
              height={30}
              cursor="pointer"
            >
              Clear
            </Button>
          </Box>
          <>
            <Box
              display="flex"
              justifyContent="Center"
              gap={20}
              marginBottom={10}
            >
              {tabIndex === 0 ? (
                <>
                  <Box
                    background={modalBackgroundColor}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    paddingLeft={20}
                    paddingRight={20}
                    borderRadius={15}
                  >
                    <Image
                      src={require("../../images/solarheroes.png")}
                      alt={"Solar"}
                      width={30}
                      height={30}
                    />
                    <Box marginTop={10} fontSize={12}>
                      {" "}
                      Cyber Solar Hero{" "}
                    </Box>
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Image
                      src={require("../../images/yellowarrow.png")}
                      alt={"arrow"}
                      width={15}
                      height={15}
                    ></Image>
                  </Box>
                  <Box
                    className="modalSwapBox"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    background={modalBackgroundColor}
                    padding={20}
                    borderRadius={15}
                  >
                    <Image
                      src={require("../../images/solartoken.png")}
                      alt={"Solar"}
                      width={30}
                      height={30}
                    />
                    <Box marginTop={5} fontSize={12}>
                      {" "}
                      Solar Tokens{" "}
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    className="modalSwapBox"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    background={modalBackgroundColor}
                    padding={20}
                    borderRadius={15}
                  >
                    <Image
                      src={require("../../images/solartoken.png")}
                      alt={"Solar"}
                      width={30}
                      height={30}
                    />
                    <Box marginTop={10} fontSize={12}>
                      {" "}
                      Solar Tokens{" "}
                    </Box>
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Image
                      src={require("../../images/yellowarrow.png")}
                      alt={"arrow"}
                      width={15}
                      height={15}
                    ></Image>
                  </Box>
                  <Box
                    background={modalBackgroundColor}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    padding={20}
                    borderRadius={15}
                  >
                    <Image
                      src={require("../../images/solarheroes.png")}
                      alt={"Solar"}
                      width={30}
                      height={30}
                    />
                    <Box marginTop={10} fontSize={12}>
                      {" "}
                      Cyber Solar Hero{" "}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
            <Box>
              <Box
                background={modalBackgroundColor}
                borderRadius={20}
                padding={20}
                fontSize={14}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
                gap={10}
              >
                <Box>Amount of NFTs: {selectedMultipleNfts.length}</Box>
                <Box>
                  Total Price:{" "}
                  {parseFloat(
                    Number(config.price_per_nft) * selectedMultipleNfts.length
                  )}{" "}
                  {config.token_denom}
                </Box>
              </Box>
            </Box>
            <Button
              onClick={() => {
                tabIndex === 0
                  ? handleMultipleNftSwap()
                  : handleMultipleSolarSwap();
              }}
              background="linear-gradient(180deg, #FFD602 0%, #FFA231 100%)"
              color="black"
              borderRadius={50}
              padding={10}
              width={150}
              height={30}
              cursor="pointer"
            >
              Swap
            </Button>
          </>
        </Box>
      )}

      {selectedNftDetails && !multipleSelect && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          style={customStyles}
          contentLabel="Selected NFT Details"
          color={inputColor}
        >
          <button
            onClick={() => setModalIsOpen(false)}
            style={{
              position: "absolute",
              right: "20px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <CloseIcon color={inputColor} />
          </button>
          <Center>
            <Image
              src={selectedNftDetails.image.replace(
                "ipfs://",
                "https://ipfs.io/ipfs/"
              )}
              alt={selectedNftDetails.name}
              width={200}
              height={200}
              style={{ borderRadius: "15px", marginBottom: "5px",  marginTop: "20px"}}
            />
          </Center>
          <h3>Cyber Solar Hero #{selectedNftDetails.tokenId}</h3>
          <p style={{ fontSize: "13px" }}>{selectedNftDetails.description}</p>
          {tabIndex === 0 ? (
            <Box
              display="flex"
              justifyContent="Center"
              gap={20}
              marginBottom={10}
            >
              <Box
                background={modalBackgroundColor}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                padding={20}
                borderRadius={15}
              >
                <Image
                  src={require("../../images/solarheroes.png")}
                  alt={"Solar"}
                  width={40}
                  height={40}
                />
                <Box marginTop={10} fontSize={12}>
                  {" "}
                  Cyber Solar Hero{" "}
                </Box>
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Image
                  src={require("../../images/yellowarrow.png")}
                  alt={"arrow"}
                  width={20}
                  height={20}
                ></Image>
              </Box>
              <Box
                className="modalSwapBox"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                background={modalBackgroundColor}
                padding={20}
                borderRadius={15}
              >
                <Image
                  src={require("../../images/solartoken.png")}
                  alt={"Solar"}
                  width={40}
                  height={40}
                />
                <Box marginTop={10} fontSize={12}>
                  {" "}
                  Solar Tokens{" "}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              display="flex"
              justifyContent="Center"
              gap={20}
              marginBottom={10}
            >
              <Box
                background={modalBackgroundColor}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                padding={20}
                borderRadius={15}
              >
                <Image
                  src={require("../../images/solartoken.png")}
                  alt={"Solar"}
                  width={40}
                  height={40}
                />

                <Box marginTop={10} fontSize={12}>
                  {" "}
                  Solar Tokens{" "}
                </Box>
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Image
                  src={require("../../images/yellowarrow.png")}
                  alt={"arrow"}
                  width={20}
                  height={20}
                ></Image>
              </Box>
              <Box
                className="modalSwapBox"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                background={modalBackgroundColor}
                padding={20}
                borderRadius={15}
              >
                <Image
                  src={require("../../images/solarheroes.png")}
                  alt={"Solar"}
                  width={40}
                  height={40}
                />
                <Box marginTop={10} fontSize={12}>
                  {" "}
                  Cyber Solar Heroes{" "}
                </Box>
              </Box>
            </Box>
          )}
          {tabIndex === 0 ? (
            <Box>
              <Box
                background={modalBackgroundColor}
                borderRadius={20}
                padding={10}
                fontSize={14}
              >
                <Center>
                  Price for NFT: {config.price_per_nft} {config.token_denom}
                </Center>
              </Box>
              <Center>
                <Button
                  borderRadius={50}
                  width={150}
                  height={30}
                  onClick={swapNftToTokens}
                  disabled={swapping}
                  background="linear-gradient(180deg, #FFD602 0%, #FFA231 100%)"
                  color="black"
                  cursor="pointer"
                  marginTop={15}
                >
                  Swap
                </Button>
              </Center>
            </Box>
          ) : (
            <Box>
              <Box
                background={modalBackgroundColor}
                borderRadius={20}
                padding={10}
                fontSize={14}
              >
                <Center>
                  Amount to receive: {config.price_per_nft} {config.token_denom}
                </Center>
              </Box>
              <Center>
                <Button
                  borderRadius={50}
                  width={150}
                  height={30}
                  onClick={handleApproveAndSwap}
                  disabled={swapping}
                  background="linear-gradient(180deg, #FFD602 0%, #FFA231 100%)"
                  color="black"
                  cursor="pointer"
                  marginTop={15}
                >
                  {" "}
                  Swap
                </Button>
              </Center>
            </Box>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Swap;
