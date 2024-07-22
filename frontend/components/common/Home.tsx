import React, { useEffect, useState } from "react";
import { useWalletAddress } from "../../context/WalletAddressContext";
import { queryStakers } from "../../utils/queryStaker";
import { Spinner, Box } from "@interchain-ui/react";
import StackedBarChart from "./stackedBarChart";
import { getBalances } from "@/utils/junoBalances";

export const Home = () => {
  const [staker, setStakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { walletAddress } = useWalletAddress();
  const [balances, setBalances] = useState([]);
  

  useEffect(() => {
    const fetchStakers = async () => {
      if (walletAddress) {
        setLoading(true);
        try {
          const stakersResult = await queryStakers(walletAddress);
          setStakers(stakersResult);
          
          const balancesResult = await getBalances(walletAddress);
          setBalances(balancesResult);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStakers();
  }, [walletAddress]);

  if (loading) {
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

  if (!walletAddress) {
    return (
      <Box>
        Connect Wallet
      </Box>
    );
  }

  const filteredBalances = balances.filter(balance => 
    balance.denom === 'factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka' || 
    balance.denom === 'ujunox'
  );

  return (
    <div>
      <div style={{ width: "50%", margin: "auto" }}>
        <StackedBarChart balances={filteredBalances} />
      </div>
    </div>
  );
};

export default Home;
