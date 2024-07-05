import {
  Box,
  Button,
  Icon,
  useColorModeValue,
  useTheme,
} from "@interchain-ui/react";
import { ChainSelect } from "../wallet/Chain";
import { useChain } from "@cosmos-kit/react";
import { chains } from "chain-registry";
import { CHAIN_NAME_STORAGE_KEY } from "@/config";

type FooterProps = {
  chainName: string;
  handleChainChange: (chainName?: string) => void;
};

export const Footer: React.FC<FooterProps> = ({ chainName, handleChainChange }) => {
  const { theme, setTheme } = useTheme();
  const chain = useChain(chainName);

  const toggleColorMode = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const onChainChange = (newChainName?: string) => {
    handleChainChange(newChainName);
    localStorage.setItem(CHAIN_NAME_STORAGE_KEY, chainName!);
  };

  return (
    <Box as="footer" display="flex" justifyContent="space-between" maxHeight="$20" marginTop="$10">
      <Button
        intent="secondary"
        size="sm"
        attributes={{
          paddingX: 0,
        }}
        onClick={toggleColorMode}
      >
        <Icon name={useColorModeValue("moonLine", "sunLine")} />
      </Button>
      <Box>
        &copy; 2024 Solar DAO. All rights reserved.
      </Box>
      <Box mx="auto" maxWidth="28rem" attributes={{ mb: "$12" }}>
        <ChainSelect
          chains={chains}
          chainName={chainName}
          onChange={onChainChange}
        />
      </Box>
    </Box>
  );
};

