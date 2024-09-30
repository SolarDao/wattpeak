import { Box, useColorModeValue } from "@interchain-ui/react";
import { Wallet } from "../wallet/Wallet"; // Adjust the import path if necessary
import { Dispatch, SetStateAction, useState } from "react";
import SolarDaoImage from "../../public/solarDAO.png";
import Image from "next/image";
import { slide as Menu } from "react-burger-menu";
import { useMediaQuery } from "react-responsive";

type HeaderProps = {
  setCurrentSection: Dispatch<SetStateAction<string>>;
  chainName: string;
};

const navItemsDesktop = [
  { name: "Mint", id: "minting" },
  { name: "Stake", id: "staking" },
  { name: "Swap", id: "swapping" },
  { name: "FAQ", id: "faq" },
];
const navItemsMobile = [
  { name: "Mint", id: "minting" },
  { name: "Stake", id: "staking" },
  { name: "Swap", id: "swapping" },
  { name: "FAQ", id: "faq" },
];

export const Header: React.FC<HeaderProps> = ({
  setCurrentSection,
  chainName,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const handleChainChange = (newChainName: string) => {
    setCurrentSection((currentSection) => currentSection); // Just to trigger re-render if needed
    setMenuOpen(false); // Close the menu
  };

  const handleMenuStateChange = (state: { isOpen: boolean }) => {
    setMenuOpen(state.isOpen);
  };

  const handleItemClick = (id: string) => {
    setCurrentSection(id);
    setMenuOpen(false); // Close the menu
  };
  const background = useColorModeValue(
    "linear-gradient(116.82deg, #855d15 0%, #141406 99.99%, #070D1C 100%)",
    "rgba(52, 52, 52, 1)"
  );

  var styles = {
    bmBurgerButton: {
      position: "absolute",
      width: "25px",
      height: "25px",
      right: "55px",
      top: "33px",
    },
    bmBurgerBars: {
      background: "#F0F8FF",
    },
    bmBurgerBarsHover: {
      background: "#a90000",
    },
    bmCrossButton: {
      height: "24px",
      width: "24px",
    },
    bmCross: {
      background: "#bdc3c7",
    },
    bmMenuWrap: {
      height: "100%",
      position: "fixed",
      top: "0",
      right: "0",
    },
    bmMenu: {
      background: background,
      padding: "2.5em 1.5em 0",
      fontSize: "1.15em",
      height: "100%",
    },
    bmMorphShape: {
      fill: "#373a47",
    },
    bmItemList: {
      padding: "0.8em",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      color: "white",
      fontSize: "30px",
      cursor: "pointer",
      gap: "20px",
    },
    bmItem: {},
    bmOverlay: {
      background: "rgba(0, 0, 0, 0.3)",
    },
  };

  return (
    <>
      <Box>
        {isMobile ? (
          <Box
            as="nav"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="$8"
            px="$4"
            marginBottom="$0"
            marginLeft="$6"
            marginRight="$6"
          >
            <Box
              as="a"
              // @ts-ignore
              onClick={() => handleItemClick("home")}
              attributes={{
                fontWeight: "$medium",
                fontSize: { mobile: "$xl", tablet: "$2xl" },
                cursor: "pointer",
                textDecoration: "none",
                marginTop: "15px",
                marginBottom: "15px",
              }}
            >
              <Image
                src={SolarDaoImage}
                alt={"SolarDaoImage"}
                width={200}
                height={25}
              />
            </Box>
            <Menu
              right
              styles={styles}
              isOpen={menuOpen}
              onStateChange={handleMenuStateChange}
            >
              {navItemsMobile.map((item) => (
                <a
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="menu-item"
                >
                  {item.name}
                </a>
              ))}
              <div
                onClick={() => {
                  setMenuOpen(false);
                }}
              >
                <Wallet
                  chainName={chainName}
                  onChainChange={handleChainChange}
                />
              </div>
            </Menu>
          </Box>
        ) : (
          <Box
            as="nav"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="$8"
            px="$4"
            maxHeight="$18"
            marginBottom="$0"
            marginLeft="$6"
            marginRight="$10"
          >
            <Box
              as="a"
              // @ts-ignore
              onClick={() => handleItemClick("home")}
              attributes={{
                fontWeight: "$medium",
                fontSize: { mobile: "$xl", tablet: "$2xl" },
                cursor: "pointer",
                textDecoration: "none",
                marginTop: "15px",
                marginBottom: "15px",
              }}
            >
              <Image
                src={SolarDaoImage}
                alt={"SolarDaoImage"}
                width={200}
                height={25}
              />
            </Box>
            <Box display="flex" alignItems="center" gap="$13" marginLeft="-22px">
              {navItemsDesktop.map((item) => (
                <Box
                  key={item.id}
                  as="a"
                  // @ts-ignore
                  onClick={() => handleItemClick(item.id)}
                  attributes={{
                    fontWeight: "$medium",
                    fontSize: { mobile: "$xl", tablet: "$2xl" },
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "white",
                  }}
                >
                  {item.name}
                </Box>
              ))}
            </Box>
            <Wallet chainName={chainName} onChainChange={handleChainChange} />
          </Box>
        )}
      </Box>
    </>
  );
};
