import {
  Box,
  Text,
  useColorModeValue,
  useTheme,
} from "@interchain-ui/react";
import { dependencies } from "@/config";
import { useState } from "react";
import { Wallet } from "@/components";
import { CHAIN_NAME } from "@/config";
import { Dispatch, SetStateAction } from 'react';

type HeaderProps = {
  setCurrentSection: Dispatch<SetStateAction<string>>;
};

const stacks = ["Cosmos Kit", "Next.js"];
const stargazejs = dependencies[0];

const navItems = [
  { name: "Minting", id: "minting" },
  { name: "Staking", id: "staking" },
  { name: "Swapping", id: "swapping" },
  { name: "Projects", id: "projects" },
  { name: "FAQ", id: "faq" },
];

export const Header: React.FC<HeaderProps> = ({ setCurrentSection }) => {
  const { theme, setTheme } = useTheme();

  const [chainName, setChainName] = useState(CHAIN_NAME);

  function onChainChange(chainName?: string) {
    setChainName(chainName!);
  }

  return (
    <>
      <Box
        as="nav"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="$8"
        px="$4"
      >
        <Text fontSize='$4xl'>
          Solar DAO
        </Text>
        <Box display="flex" alignItems="center">
        {navItems.map((item) => (
          <Box
            key={item.id}
            as="a"
            onClick={() => setCurrentSection(item.id)}
            attributes={{
              // eslint-disable-next-line react-hooks/rules-of-hooks
              color: useColorModeValue("$gray900", "$gray100"),
              fontWeight: "$medium",
              fontSize: { mobile: "$xl", tablet: "$2xl" },
              marginRight: "$4",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            {item.name}
          </Box>
        ))}
      </Box>
        <Wallet chainName={chainName} onChainChange={onChainChange} />
      </Box>
    </>
  );
}
