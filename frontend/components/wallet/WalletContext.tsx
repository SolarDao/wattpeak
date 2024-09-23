import React, { createContext, useContext, useState, useEffect } from 'react';
import { useChain, useWallet } from '@cosmos-kit/react';
import { WalletStatus } from '@cosmos-kit/core';

interface WalletContextProps {
  status: WalletStatus;
  address?: string;
  loading: boolean;
  connectWallet: () => void;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode; chainName: string }> = ({ children, chainName }) => {
  const wallet = useWallet();
  const { status, address, connect } = useChain(chainName, !!wallet);
  const [loading, setLoading] = useState(true); // Loading state

  // Automatically connect if disconnected on mount
  useEffect(() => {
    if (status === WalletStatus.Disconnected) {
      connect();
    }
  }, [status, connect]);

  // Track loading state and whether the wallet is connected
  useEffect(() => {
    if (status === WalletStatus.Connected) {
      setLoading(false);
    } else if (status === WalletStatus.Connecting || status === WalletStatus.Disconnected) {
      setLoading(true); // Still loading
    }
  }, [status]);

  const connectWallet = () => {
    if (status === WalletStatus.Disconnected) {
      connect(); // Trigger wallet connection
    }
  };

  return (
    <WalletContext.Provider value={{ status, address, loading, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
