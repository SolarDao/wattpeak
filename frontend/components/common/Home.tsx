import React, { useEffect, useState } from 'react';
import { useWalletAddress } from '../../context/WalletAddressContext';
import { queryStakers } from '../../utils/queryStaker';

export const Home = () => {
  const [staker, setStakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { walletAddress } = useWalletAddress();
  console.log('Address:', walletAddress);

  useEffect(() => {
    const fetchStakers = async () => {
      if (walletAddress) {
        try {
          const result = await queryStakers(walletAddress);
          setStakers(result);
          console.log('Staker:', result);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
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
        <p>claimable_rewards: {staker.claimable_rewards}</p>
        <p>interest earned: {staker.interest_wattpeak}</p>
        <p>staking start time: {staker.stake_start_time}</p>
        <p>wattpeak staked: {staker.wattpeak_staked / 1000000}</p>
    </div>
  );
};

export default Home;
