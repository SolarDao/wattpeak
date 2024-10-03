import React from "react";
import { useColorModeValue } from "@interchain-ui/react";
import Image from "next/image";
import { Button, Box } from "@chakra-ui/react";
import { formatBalanceNoConversion } from "@/utils/balances/formatBalances";

interface MultipleSelectBoxProps {
  tabIndex: number;
  walletNfts: any[];
  contractNfts: any[];
  selectedMultipleNfts: string[];
  setSelectedMultipleNfts: (nfts: string[]) => void;
  handleMultipleNftSwap: () => void;
  handleMultipleSolarSwap: () => void;
  config: { price_per_nft: string; token_denom: string };
}

const MultipleSelectBox: React.FC<MultipleSelectBoxProps> = ({
  tabIndex,
  walletNfts,
  contractNfts,
  selectedMultipleNfts,
  setSelectedMultipleNfts,
  handleMultipleNftSwap,
  handleMultipleSolarSwap,
  config,
}) => {
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );
  const modalBackgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.07)",
    "rgba(35, 35, 35, 1)"
  );
  const inputColor = useColorModeValue("black", "white");

  return (
    <Box
      className="selectedNftBox"
      background={backgroundColor}
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap={10}
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={5}>
        <Box display="flex" gap={5} alignItems="center">
          {(tabIndex === 0 ? walletNfts : contractNfts)
            .filter((nft) => selectedMultipleNfts.includes(nft.tokenId))
            .slice(0, 5) // Limit to first 5 images
            .map((nft) => (
              <Box key={nft.tokenId} width={50} height={50}>
                {" "}
                {/* Match image box size */}
                <Image
                  src={`/api/image-proxy?ipfsPath=${encodeURIComponent(
                    nft.image.replace("ipfs://", "")
                  )}`}
                  alt={nft.name}
                  width={50}
                  height={50}
                  style={{ borderRadius: "10px", display: "flex", gap: 2 }}
                />
              </Box>
            ))}
          {selectedMultipleNfts.length > 5 && (
            <Box
              width={40} // Match the image box width
              height={40} // Match the image box height
              display="flex"
              alignItems="center"
              justifyContent="center"
              background={modalBackgroundColor}
              borderRadius="10px"
              fontSize="14px"
              color={inputColor}
            >
              +{selectedMultipleNfts.length - 5}
            </Box>
          )}
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
        <Box display="flex" justifyContent="Center" gap={20} marginBottom={10}>
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
                  src={require("../../../images/solarheroes.png")}
                  alt={"Solar"}
                  width={30}
                  height={30}
                />
                <Box marginTop={10} fontSize={12}>
                  Cyber Solar Hero
                </Box>
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Image
                  src={require("../../../images/yellowarrow.png")}
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
                  src={require("../../../images/solartoken.png")}
                  alt={"Solar"}
                  width={30}
                  height={30}
                />
                <Box marginTop={5} fontSize={12}>
                  Solar Tokens
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
                  src={require("../../../images/solartoken.png")}
                  alt={"Solar"}
                  width={30}
                  height={30}
                />
                <Box marginTop={10} fontSize={12}>
                  Solar Tokens
                </Box>
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center">
                <Image
                  src={require("../../../images/yellowarrow.png")}
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
                  src={require("../../../images/solarheroes.png")}
                  alt={"Solar"}
                  width={30}
                  height={30}
                />
                <Box marginTop={10} fontSize={12}>
                  Cyber Solar Hero
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
              {tabIndex === 0 ? "Amount to receive:" : "Total Price: "}
              {formatBalanceNoConversion(
                Number(config.price_per_nft) * selectedMultipleNfts.length
              )}{" "}
              $SOLAR
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
  );
};

export default MultipleSelectBox;
