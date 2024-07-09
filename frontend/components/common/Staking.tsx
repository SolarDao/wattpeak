import React, { useEffect, useState } from "react";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
import {
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Button,
  Input,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { getBalances } from "../../utils/junoBalances";
import { queryStakers } from "@/utils/queryStaker";

const STAKER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS;
const wattpeadDenom =
  "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka";
  

export const Staking = ({ chainName }) => {
  const wallet = useWallet();
  const walletName = wallet?.wallet?.name ?? "";
  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(
    chainName,
    walletName
  );

  const [amount, setAmount] = useState(0.0);
  const [staker, setStakers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [signingClient, setSigningClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wattpeakBalance = balances.find((balance) => balance.denom === wattpeadDenom)?.amount / 1000000 || 0;
  const stakedWattpeak = staker.wattpeak_staked / 1000000;

  useEffect(() => {
    const fetchClient = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client);
          await getBalances(address).then((result) => {
            setBalances(result);
            console.log("Balances:", result);
          });
          let result = await queryStakers(address);
          setStakers(result);
        } catch (err) {
          setError(err);
          console.error("Error getting signing client:", err);
        }
      } else {
        await connect();
      }
    };

    fetchClient();
  }, [status, getSigningCosmWasmClient, connect, address]);

  const handleStake = async () => {
    if (!signingClient) {
      console.error("Signing client not initialized");
      return;
    }

    const stakeMsg = {
      stake: {},
    };

    try {
      setLoading(true);
      const result = await signingClient.execute(
        address, // Sender address
        STAKER_CONTRACT_ADDRESS, // Contract address
        stakeMsg, // Execute message
        {
          amount: [{ denom: "ujunox", amount: "7500" }], // fee
          gas: "3000000", // gas limit
        },
        "", // Optional memo
        [{ denom: wattpeadDenom, amount: (amount * 1000000).toString() }] // Funds sent with transaction
      );
      getBalances(address).then((result) => {
        setBalances(result);
        console.log("Balances:", result);
      });
      let result1 = await queryStakers(address);
      setStakers(result1);
      setAmount(0);
      console.log("Staking result:", result);
    } catch (err) {
      setError(err);
      console.error("Error executing stake:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!signingClient) {
      console.error("Signing client not initialized");
      return;
    }

    const unstakeMsg = {
      unstake: { amount: (amount * 1000000).toString() },
    };

    try {
      setLoading(true);
      const result = await signingClient.execute(
        address, // Sender address
        STAKER_CONTRACT_ADDRESS, // Contract address
        unstakeMsg, // Execute message
        {
          amount: [{ denom: "ujunox", amount: "7500" }], // fee
          gas: "3000000", // gas limit
        }
      );
      getBalances(address).then((result) => {
        setBalances(result);
        console.log("Balances:", result);
      });
      let result2 = await queryStakers(address);
      setStakers(result2);
      setAmount(0);
      console.log("Unstaking result:", result);
    } catch (err) {
      setError(err);
      console.error("Error executing unstake:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box width="100%" maxW="500px" mx="auto" mt="50px" p="20px" borderRadius="10px" borderWidth="1px">
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Stake</Tab>
          <Tab>Unstake</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <h1>Stake Wattpeak</h1>
            <p>Available balance to stake: {wattpeakBalance}</p>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.min(parseFloat(e.target.value), wattpeakBalance))}
              min="0.000001"
              max={wattpeakBalance}
              step="0.0001"
              placeholder="Amount"
            />
            <Button onClick={() => setAmount(wattpeakBalance)} mb="10px">
              Max
            </Button>
            <Button onClick={handleStake} disabled={loading}>
              {loading ? <Spinner /> : "Stake"}
            </Button>
          </TabPanel>
          <TabPanel>
            <h1>Unstake Wattpeak</h1>
            <p>Available balance to unstake: {stakedWattpeak}</p>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.min(parseFloat(e.target.value), stakedWattpeak))}
              min="0.000001"
              max={stakedWattpeak}
              step="0.001"
              placeholder="Amount"
            />
            <Button onClick={() => setAmount(stakedWattpeak)} mb="10px">
              Max
            </Button>
            <Button onClick={handleUnstake} disabled={loading}>
              {loading ? <Spinner /> : "Unstake"}
            </Button>
          </TabPanel>
        </TabPanels>
      </Tabs>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error.message}
        </Alert>
      )}
    </Box>
  );
};

export default Staking;
