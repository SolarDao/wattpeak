import React, { useEffect, useState } from 'react';
import { getBalances } from '../../utils/junoBalances';
import { useWalletAddress } from '../../context/WalletAddressContext';

const Balances = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { walletAddress } = useWalletAddress();
  console.log('Wallet Address:', walletAddress);

  useEffect(() => {
    const fetchBalances = async () => {
      if (walletAddress) {
        try {
          const result = await getBalances(walletAddress);
          setBalances(result);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchBalances();
  }, [walletAddress]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Wallet Balances</h1>
      <ul>
        {balances.map((balance, index) => (
          <li key={index}>
            <p>Denom: {balance.denom}</p>
            <p>Amount: {balance.amount}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Balances;
