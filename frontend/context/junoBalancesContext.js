import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBalances } from '../utils/junoBalances';
import { useWalletAddress } from './WalletAddressContext'; // Adjust the path as needed

const BalancesContext = createContext();

export const BalancesProvider = ({ children }) => {
  const { walletAddress } = useWalletAddress();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalances = async () => {
      if (walletAddress) {
        try {
          setLoading(true);
          const result = await getBalances(walletAddress);
          setBalances(result);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBalances();
  }, [walletAddress]);

  return (
    <BalancesContext.Provider value={{ balances, loading, error }}>
      {children}
    </BalancesContext.Provider>
  );
};

export const useBalances = () => {
  return useContext(BalancesContext);
};
