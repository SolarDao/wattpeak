import React, { createContext, useContext, useState } from 'react';

const WalletAddressContext = createContext();

export const WalletAddressProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");

  return (
    <WalletAddressContext.Provider value={{ walletAddress, setWalletAddress }}>
      {children}
    </WalletAddressContext.Provider>
  );
};

export const useWalletAddress = () => {
  return useContext(WalletAddressContext);
};
