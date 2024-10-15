import React from "react";
import Modal from "react-modal";
import { useColorModeValue } from "@interchain-ui/react";
import Image from "next/image";
import { CloseIcon } from "@chakra-ui/icons";
import { Center, Button, Box, Text, Heading } from "@chakra-ui/react";
import { useMediaQuery } from "react-responsive";
import { formatBalance, } from "@/utils/balances/formatBalances";
import { formatDenom } from "@/utils/balances/formatDenoms";

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
  swapNftToTokens,
  handleSolarSwap,
  inputColor,
  modalBackgroundColor,
}) => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const backgroundColor = useColorModeValue("white", "rgba(52, 52, 52, 1)");
  const borderColor = useColorModeValue("1px solid black", "1px solid white");
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
      height: "72%",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.5)",
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
      <Button
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
      </Button>
      <Center
        width={200}
        height={200}
        style={{
          borderRadius: "23px",
          marginBottom: "5px",
          marginTop: "30px",
          margin: "auto",
        }}
        boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
      >
        <Image
          src={`/api/image-proxy?ipfsPath=${encodeURIComponent(
            selectedNftDetails.image.replace("ipfs://", "")
          )}`}
          alt={selectedNftDetails.name}
          width={200}
          height={200}
          style={{
            borderRadius: "23px",
          }}
        />
      </Center>
      <Heading fontSize="18px">
        Cyber Solar Hero #{selectedNftDetails.tokenId}
      </Heading>
      <Text style={{ fontSize: "13px" }}>{selectedNftDetails.description}</Text>
      <Box display="flex" justifyContent="Center" gap={20} marginBottom={10}>
        <Box
          background={modalBackgroundColor}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          padding={20}
          borderRadius={15}
          boxShadow="0px 1px 2px rgba(0, 0, 0, 0.5)"
        >
          <Image
            src={
              tabIndex === 0
                ? require("../../../images/solarheroes.png")
                : require("../../../images/solartoken.png")
            }
            alt={"Solar"}
            width={40}
            height={40}
          />
          <Box marginTop={10} fontSize={12}>
            {tabIndex === 0 ? "Cyber Solar Heroes" : "Solar Tokens"}
          </Box>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Image
            src={require("../../../images/yellowarrow.png")}
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
          boxShadow="0px 1px 2px rgba(0, 0, 0, 0.5)"
        >
          <Image
            src={
              tabIndex === 0
                ? require("../../../images/solartoken.png")
                : require("../../../images/solarheroes.png")
            }
            alt={"Solar"}
            width={40}
            height={40}
          />
          <Box marginTop={10} fontSize={12}>
            {tabIndex === 0 ? "Solar Tokens" : "Cyber Solar Heroes"}
          </Box>
        </Box>
      </Box>
      <Box>
        <Box
          background={modalBackgroundColor}
          borderRadius={13}
          padding={10}
          fontSize={14}
          width="88%"
          boxShadow="0px 1px 2px rgb(0, 0, 0, 0.5)"
          margin="auto"
        >
          <Center>
            {tabIndex === 0 ? "Amount to receive: " : "Total Price: "}
            {formatBalance(Number(config.price_per_nft))} {formatDenom(config.token_denom)}
          </Center>
        </Box>
        <Center>
          <Button
            borderRadius="13px"
            width={150}
            height={30}
            onClick={tabIndex === 0 ? swapNftToTokens : handleSolarSwap }
            boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
            border={borderColor}
            color={textColor}
            background={backgroundColor}
            cursor="pointer"
            marginTop={25}
            letterSpacing="0.1em"
            _hover={{
              background: "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
              color: "black",
            }}
          >
            SWAP
          </Button>
        </Center>
      </Box>
    </Modal>
  );
};

export default NftDetailsModal;
