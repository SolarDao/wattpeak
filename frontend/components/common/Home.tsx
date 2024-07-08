import React, { useEffect, useState } from 'react';
import { useWalletAddress } from '../../context/WalletAddressContext';
import { queryStakers } from '../../utils/queryStaker';

export const Home = () => {
  const [staker, setStaker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { walletAddress } = useWalletAddress();

  console.log('Wallet Address:', walletAddress);

  useEffect(() => {
    const fetchStakers = async () => {
      if (walletAddress) {
        try {
          const result = await queryStakers(walletAddress);
          setStaker(result);
          console.log('Stakers:', result);
          setLoading(false);
        } catch (err) {
          setError(err);
          console.error('Error fetching stakers:', err);
          setLoading(false);
        }
      } else {
        console.log('No wallet address available yet');
      }
    };

    fetchStakers();
  }, [walletAddress]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Home Page</h1>
      <h2>Stakers Info</h2>
        <p>{staker.claimable_rewards}</p>
        <p>{staker.interest_wattpeak}</p>
        <p>{staker.stake_start_time}</p>
        <p>{staker.wattpeak_staked}</p>
    </div>
  );
};

export default Home;
