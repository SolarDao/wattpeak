import { useEffect, useState } from 'react';
import { Box, Stack, Icon } from "@interchain-ui/react";
import { WalletStatus } from "@cosmos-kit/core";
import { useChain, useWallet } from "@cosmos-kit/react";
import { ButtonConnect, ButtonConnected, ButtonConnecting, ButtonDisconnected, ButtonError, ButtonNotExist, ButtonRejected } from "./Connect";
import { Warning } from "./Warning"; // Import the Warning component
import { useWalletAddress } from '@/context/WalletAddressContext';

export type WalletProps = {
  chainName: string;
  onChainChange?: (chainName: string) => void;
};

export function Wallet({ chainName, onChainChange }: WalletProps) {
  const walletName = useWallet();
  
  const { chain, status, wallet, message, connect, openView, address } = useChain(chainName, !!walletName);
  const { setWalletAddress } = useWalletAddress(); // Use the context

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address, setWalletAddress]);

  useEffect(() => {
    if (onChainChange && chain.chain_name !== chainName) {
      onChainChange(chain.chain_name);
    }
  }, [chain, chainName, onChainChange]);

  useEffect(() => {
    if (status === WalletStatus.Connected && address) {
      // Do something with the address if needed
    }
  }, [status, address]);

  const ConnectButton = {
    [WalletStatus.Connected]: <ButtonConnected onClick={openView} />,
    [WalletStatus.Connecting]: <ButtonConnecting />,
    [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect} />,
    [WalletStatus.Error]: <ButtonError onClick={() => {
      setErrorMessage(message || "Unknown error");
      setIsAlertVisible(true);
    }} />,
    [WalletStatus.Rejected]: <ButtonRejected onClick={() => {
      setErrorMessage(message || "Unknown error");
      setIsAlertVisible(true);
    }} />,
    [WalletStatus.NotExist]: <ButtonNotExist onClick={openView} />,
  }[status] || <ButtonConnect onClick={connect} />;

  return (
    <Box position="relative">
      {isAlertVisible && (
        <Box
          position="absolute"
          top="0"
          left="50%"
          transform="translateX(-50%)"
          zIndex="9999"
        >
          <Warning
            text={errorMessage}
            icon={<Icon name="errorWarningLine" size="$lg" />}
          />
        </Box>
      )}
      <Box py="$16">
        <Stack
          direction="vertical"
          attributes={{
            mx: "auto",
            px: "$8",
            py: "$15",
            maxWidth: "21rem",
            justifyContent: "center",
          }}
        >
          <Box
            my="$8"
            flex="1"
            width="full"
            display="flex"
            paddingRight="0"
            height="$16"
            overflow="hidden"
            justifyContent="center"
            px={{ mobile: "$8", tablet: "$10" }}
          >
            {ConnectButton}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
