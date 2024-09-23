import { Box, Container, useColorModeValue } from "@interchain-ui/react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Minting } from "./Minting";
import { Staking } from "./Staking";
import { Swap } from "./Swap";
import { Faq } from "./Faq";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { SideNavbar } from "./SideNavbar";
import { Home } from "./Home";
import { useWallet } from "@cosmos-kit/react";
import { Flex } from "@chakra-ui/react";
import { Wallet } from "../wallet";
import { useMediaQuery } from "react-responsive";
import { WalletStatus } from "@cosmos-kit/core";

const JUNO_CHAIN_NAME = "junotestnet";
const STARGAZE_CHAIN_NAME = "stargazetestnet";
const CHAIN_NAME_STORAGE_KEY = "junotestnet";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentSection, setCurrentSection] = useState("home");
  const [initialLoading, setInitialLoading] = useState(false);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>(WalletStatus.Disconnected);
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const wallet = useWallet();
  const [chainName, setChainName] = useState(JUNO_CHAIN_NAME);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const backgroundImage = useColorModeValue(
    "linear-gradient(116.82deg, #855d15 0%, #141406 99.99%, #070D1C 100%)",
    ""
  );
  const backgroundColor = useColorModeValue("", "rgba(52, 52, 52, 1)");
  const backgroundColor2 = useColorModeValue("$white", "rgba(35, 35, 35, 1)");
  const inputColor = useColorModeValue("$black", "$white");

  // Function to handle wallet status changes from the Wallet component
  const handleWalletStatusChange = (status: WalletStatus, address: string | undefined) => {
    setWalletStatus(status);
    setWalletAddress(address);
    setInitialLoading(status !== WalletStatus.Connected);
  };

  const handleSectionChange: Dispatch<SetStateAction<string>> = (
    section: SetStateAction<string>
  ) => {
    setCurrentSection(section);
    const newChainName =
      section === "swapping" ? STARGAZE_CHAIN_NAME : JUNO_CHAIN_NAME;
    setChainName(newChainName);
    localStorage.setItem(CHAIN_NAME_STORAGE_KEY, newChainName);
  };

  useEffect(() => {
    const storedChainName = localStorage.getItem(CHAIN_NAME_STORAGE_KEY);
    if (storedChainName) {
      setChainName(storedChainName);
    }
  }, []);

  useEffect(() => {
    setWalletStatus(wallet.status);
    setWalletAddress(wallet.address);
    setInitialLoading(wallet.status === WalletStatus.Connecting);
  }, [wallet.status, wallet.address]);

  // Render the correct section based on wallet status and section selected
  const renderSection = () => {
    switch (currentSection) {
      case "home":
        return (
          <Home
            initialLoading={initialLoading}
            walletStatus={walletStatus}
            walletAddress={walletAddress}
            currentSection={currentSection}
          />
        );
      case "minting":
        return <Minting chainName={chainName} />;
      case "staking":
        return <Staking chainName={chainName} />;
      case "swapping":
        return <Swap chainName={chainName} />;
      case "faq":
        return <Faq />;
      default:
        return (
          <Home
            initialLoading={initialLoading}
            walletStatus={walletStatus}
            walletAddress={walletAddress}
            currentSection={currentSection}
          />
        );
    }
  };

  // Render the Wallet component only when the wallet is not connected or still loading
  if (
    walletStatus === WalletStatus.Disconnected ||
    walletStatus === WalletStatus.NotExist
  ) {
    return (
      <>
        <Container maxWidth="80rem" py={isMobile ? "$7" : "$14"}>
          <Box
            className="box"
            backgroundImage={backgroundImage}
            backgroundColor={backgroundColor}
          >
            <Header
              setCurrentSection={handleSectionChange}
              chainName={chainName}
            />
            <Box className="whiteBox" paddingLeft={isMobile ? "$10" : "$0"}>
              {!isMobile && (
                <SideNavbar setCurrentSection={handleSectionChange} />
              )}
              <Box
                flex="1"
                p="$4"
                minHeight="$fit"
                borderRadius="$4xl"
                color="Black"
                marginRight="$10"
                maxWidth="93%"
                backgroundColor={backgroundColor2}
                color={inputColor}
              >
                {/* Render Wallet component if wallet is not connected */}
                <Flex justifyContent="center" alignItems="center" height="100%">
                <Wallet chainName={chainName} onWalletStatusChange={handleWalletStatusChange} />;
                </Flex>
              </Box>
            </Box>
            <Footer />
          </Box>
        </Container>
      </>
    );
  }
  // 5. Render the correct section when the wallet is connected
  return (
    <>
      <Container maxWidth="80rem" attributes={{ py: isMobile ? "$7" : "$14" }}>
        <Box
          className="box"
          backgroundImage={backgroundImage}
          backgroundColor={backgroundColor}
        >
          <Header
            setCurrentSection={handleSectionChange}
            chainName={chainName}
          />
          <Box className="whiteBox">
            {!isMobile && (
              <SideNavbar setCurrentSection={handleSectionChange} />
            )}
            <Box
              flex="1"
              p="$4"
              minHeight="$fit"
              borderRadius="$4xl"
              color="Black"
              marginRight="$10"
              maxWidth="93%"
              attributes={{
                backgroundColor: backgroundColor2,
                color: inputColor,
              }}
            >
              {/* Render the current section */}
              {renderSection()}
              {children}
            </Box>
          </Box>
          <Footer />
        </Box>
      </Container>
    </>
  );
};
