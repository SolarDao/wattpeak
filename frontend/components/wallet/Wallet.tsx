import { useEffect, useState } from 'react';
import { Box, Stack, Icon } from "@interchain-ui/react";
import { WalletStatus } from "@cosmos-kit/core";
import { useChain, useWallet } from "@cosmos-kit/react";
import { ButtonConnect, ButtonConnected, ButtonConnecting, ButtonDisconnected, ButtonError, ButtonNotExist, ButtonRejected } from "./Connect";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export type WalletProps = {
  chainName: string;
  onChainChange?: (chainName: string) => void;
};

export function Wallet({ chainName, onChainChange }: WalletProps) {
  const walletName = useWallet();
  
  const { chain, status, wallet, message, connect, openView, address } = useChain(chainName, !!walletName);

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

  const handleErrorClick = () => {
    toast.error(message || "Unknown error");
  };

  const handleRejectedClick = () => {
    toast.warn(message || "Request rejected");
  };

  const ConnectButton = {
    [WalletStatus.Connected]: <ButtonConnected onClick={openView} />,
    [WalletStatus.Connecting]: <ButtonConnecting />,
    [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect} />,
    [WalletStatus.Error]: <ButtonError onClick={handleErrorClick} />,
    [WalletStatus.Rejected]: <ButtonRejected onClick={handleRejectedClick} />,
    [WalletStatus.NotExist]: <ButtonNotExist onClick={openView} />,
  }[status] || <ButtonConnect onClick={connect} />;

  return (
    <Box position="relative">
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
