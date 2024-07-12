import React, { useEffect, useState } from 'react';
import { useWalletAddress } from '../../context/WalletAddressContext';
import { queryStakers } from '../../utils/queryStaker';
import { Spinner, Box } from "@interchain-ui/react";

export const Home = () => {
  const [staker, setStakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { walletAddress } = useWalletAddress();

  useEffect(() => {
    const fetchStakers = async () => {
      if (walletAddress) {
        try {
          const result = await queryStakers(walletAddress);
          setStakers(result);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      }
    };
    fetchStakers();
  }, [walletAddress]);

  if (loading && walletAddress) {
    return (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        backgroundColor="rgba(0, 0, 0, 0.5)"
        zIndex="9999"
      >
        <Spinner size="$10xl" color="white" />
      </Box>
    );
  }

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
