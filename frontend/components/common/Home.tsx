import React, { use, useEffect, useState } from "react";
import { useWalletAddress } from "../../context/WalletAddressContext";
import { queryStakers } from "../../utils/queryStaker";
import { Spinner, Box, useColorModeValue } from "@interchain-ui/react";
import StackedBarChart from "./stackedBarChart";
import { getBalances } from "@/utils/junoBalances";
import { useChains } from "@cosmos-kit/react";
import { getStargazeBalances } from "@/utils/stargazeBalances";
import { Flex } from "@chakra-ui/react";

const formatDenom = (denom) => {
  let formattedDenom = denom;

  if (denom.startsWith("factory")) {
    formattedDenom = denom.split("/").pop();
  }

  if (formattedDenom.startsWith("u")) {
    formattedDenom = formattedDenom.slice(1);
  }

  if (formattedDenom === "stars" || formattedDenom === "junox") {
    formattedDenom = formattedDenom.toUpperCase();
  }

  if (formattedDenom === "wattpeaka") {
    formattedDenom = "WattPeak";
  }

  if (formattedDenom === "som") {
    formattedDenom = "SoM";
  }
  return formattedDenom;
};

export const Home = () => {
  const [staker, setStakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { walletAddress } = useWalletAddress();
  const [balances, setBalances] = useState([]);
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );
  const chains = useChains(["stargazetestnet", "junotestnet"]);
  const connected = Object.values(chains).every(
    (chain) => chain.isWalletConnected
  );

  useEffect(() => {
    const fetchStakers = async () => {
      if (walletAddress) {
        setLoading(true);
        try {
          const stakersResult = await queryStakers(walletAddress);
          setStakers(stakersResult);

          const balancesResult = await getBalances(walletAddress);
          setBalances(balancesResult);

          const stargazeBalances = await getStargazeBalances(
            chains.stargazetestnet.address
          );
          setBalances((balances) => [...balances, ...stargazeBalances]);
          console.log(balances);
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

  const filteredBalances = balances.filter(
    (balance) =>
      balance.denom ===
        "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka" ||
      balance.denom === "ujunox" ||
      balance.denom === "ustars" ||
      balance.denom ===
        "factory/juno1clr2yca5sphmspex9q6zvrrl7aaes5q8euhljrre89p4tqqslxcqjmks4w/som"
  );

  return (
    <div>
      <Flex borderRadius="23px" backgroundColor={backgroundColor} width="20%" padding="20px" flexDirection="column" gap="5px">
      <h3>My Wallet</h3>
        {filteredBalances.map((balance) => (
          <div key={balance.denom}>
            {formatDenom(balance.denom)} :{" "}
            {parseFloat((balance.amount / 1000000).toFixed(2))}
          </div>
        ))}
      </Flex>
    </div>
  );
};

export default Home;
