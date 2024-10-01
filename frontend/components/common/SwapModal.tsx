import React from "react";
import Modal from "react-modal";
import {useColorModeValue } from "@interchain-ui/react";
import Image from "next/image";
import { CloseIcon } from "@chakra-ui/icons";
import {
    Center,
    Button,
    Box,
  } from "@chakra-ui/react";
import { useMediaQuery } from "react-responsive";

interface NftDetailsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  selectedNftDetails: any;
  config: { price_per_nft: string; token_denom: string };
  tabIndex: number;
  swapping: boolean;
  swapNftToTokens: () => void;
  handleSolarSwap: () => void;
  inputColor: string;
  modalBackgroundColor: string;
  color: string; // Add the color prop
}

const NftDetailsModal: React.FC<NftDetailsModalProps> = ({
  isOpen,
  onRequestClose,
  selectedNftDetails,
  config,
  tabIndex,
  swapping,
  swapNftToTokens,
  handleSolarSwap,
  inputColor,
  modalBackgroundColor,
}) => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const backgroundColor = useColorModeValue("white", "rgba(52, 52, 52, 1)");
  const textColor = useColorModeValue("black", "white");
  if (!selectedNftDetails) {
    return null;
  }
  
  const customStyles = {
    content: {
      top: "52%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      backgroundColor: backgroundColor,
      color: textColor,
      borderRadius: "15px",
      height: "76%",
      width: isMobile ? "70%" : "400px",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
    },
  };
  

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="Selected NFT Details"
    >
      <button
        onClick={onRequestClose}
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
            process.env.NEXT_PUBLIC_IPFS_GATEWAY || ""
          )}
          alt={selectedNftDetails.name}
          width={200}
          height={200}
          style={{
            borderRadius: "15px",
            marginBottom: "5px",
            marginTop: "20px",
          }}
        />
      </Center>
      <h3>Cyber Solar Hero #{selectedNftDetails.tokenId}</h3>
      <p style={{ fontSize: "13px" }}>{selectedNftDetails.description}</p>
      {tabIndex === 0 ? (
        <Box display="flex" justifyContent="Center" gap={20} marginBottom={10}>
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
              Cyber Solar Hero
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
              Solar Tokens
            </Box>
          </Box>
        </Box>
      ) : (
        <Box display="flex" justifyContent="Center" gap={20} marginBottom={10}>
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
              Solar Tokens
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
              Cyber Solar Heroes
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
              Amount to receive: {config.price_per_nft} {config.token_denom}
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
              Price for NFT: {config.price_per_nft} {config.token_denom}
            </Center>
          </Box>
          <Center>
            <Button
              borderRadius={50}
              width={150}
              height={30}
              onClick={handleSolarSwap}
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
      )}
    </Modal>
  );
};

export default NftDetailsModal;
