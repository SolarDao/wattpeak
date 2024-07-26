import { Box, Container, useColorModeValue } from "@interchain-ui/react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Minting } from "./Minting";
import { Staking } from "./Staking";
import { Swap } from "./Swap";
import { Faq } from "./Faq";
import { useState, useEffect } from "react";
import { SideNavbar } from "./SideNavbar";
import { Home } from "./Home";
import { useWallet } from "@cosmos-kit/react";
import { Center } from "@chakra-ui/react";
import { Wallet } from "../wallet";
import { useMediaQuery } from "react-responsive";

const JUNO_CHAIN_NAME = "junotestnet";
const STARGAZE_CHAIN_NAME = "stargazetestnet";
const CHAIN_NAME_STORAGE_KEY = "junotestnet";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState("home");
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

  const handleSectionChange = (section: string) => {
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

  const renderSection = () => {
    switch (currentSection) {
      case "home":
        return <Home />;
      case "minting":
        return <Minting chainName={chainName} />;
      case "staking":
        return <Staking chainName={chainName} />;
      case "swapping":
        return <Swap chainName={chainName} />;
      case "faq":
        return <Faq />;
      default:
        return <Home />;
    }
  };


  if (wallet?.status !== "Connected") {
    return (
      <Container maxWidth="80rem" attributes={{ py: isMobile ? "$7" : "$14" }}>
        <Box
          className="box"
          backgroundImage={backgroundImage}
          backgroundColor={backgroundColor}
        >
          <Header setCurrentSection={handleSectionChange} chainName={chainName} />
          <Box className="whiteBox" paddingLeft={isMobile ? "$10" : "$0"}>
            {!isMobile && <SideNavbar setCurrentSection={handleSectionChange} />}
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
              <Center>
                <Wallet chainName={chainName} />
              </Center>
              {children}
            </Box>
          </Box>
          <Footer />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="80rem" attributes={{ py: isMobile ? "$7" : "$14" }}>
      <Box
        className="box"
        backgroundImage={backgroundImage}
        backgroundColor={backgroundColor}
      >
        <Header setCurrentSection={handleSectionChange} chainName={chainName} />
        <Box className="whiteBox">
          {!isMobile && <SideNavbar setCurrentSection={handleSectionChange} />}
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
            {renderSection()}
            {children}
          </Box>
        </Box>
        <Footer />
      </Box>
    </Container>
  );
};
