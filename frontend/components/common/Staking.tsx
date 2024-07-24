import React, { useEffect, useState } from "react";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Button,
  Input,
  Center,
} from "@chakra-ui/react";
import { Spinner, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "../../utils/junoBalances";
import { queryStakers } from "@/utils/queryStaker";
import { queryStakingConfig } from "@/utils/queryStakingConfig";
import Confetti from "react-confetti";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { CloseIcon } from "@chakra-ui/icons";

const STAKER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS;
const wattpeadDenom =
  "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka";

export const Staking = ({ chainName }: { chainName: string }) => {
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
  const [confetti, setConfetti] = useState(false);
  const [claimableRewards, setClaimableRewards] = useState(0);
  const [config, setConfig] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const wattpeakBalance =
    balances.find((balance) => balance.denom === wattpeadDenom)?.amount /
      1000000 || 0;
  const stakedWattpeak = staker.wattpeak_staked / 1000000;
  const inputColor = useColorModeValue("black", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      try {
        if (status === "Connected") {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client);
          const balancesResult = await getBalances(address);
          setBalances(balancesResult);
          const stakersResult = await queryStakers(address);
          setStakers(stakersResult);
          const claimable = stakersResult.claimable_rewards / 1000000; // Assuming claimable_rewards is in micro units
          setClaimableRewards(claimable);
          if (claimable > 0) {
            setModalIsOpen(true); // Open the modal if there are claimable rewards
          }
          const configResult = await queryStakingConfig();
          setConfig(configResult);
          console.log("Staking config:", configResult);
        } else {
          await connect();
        }
      } catch (err) {
        setError(err);
        toast.error("Error connecting to wallet");
        console.error("Error getting signing client:", err);
      } finally {
        setLoading(false);
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
      const balancesResult = await getBalances(address);
      setBalances(balancesResult);
      const stakersResult = await queryStakers(address);
      setStakers(stakersResult);
      setClaimableRewards(stakersResult.claimable_rewards / 1000000); // Update claimable rewards
      setAmount(0);
      toast.success("Tokens staked successfully!");
    } catch (err) {
      setError(err);
      toast.error("Error staking tokens");
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
      const balancesResult = await getBalances(address);
      setBalances(balancesResult);
      const stakersResult = await queryStakers(address);
      setStakers(stakersResult);
      setClaimableRewards(stakersResult.claimable_rewards / 1000000); // Update claimable rewards
      setAmount(0);
      toast.success("Tokens unstaked successfully!");
    } catch (err) {
      setError(err);
      toast.error("Error unstaking tokens");
      console.error("Error executing unstake:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!signingClient) {
      console.error("Signing client not initialized");
      return;
    }

    const claimMsg = {
      claim_reward: {},
    };

    try {
      setLoading(true);
      const result = await signingClient.execute(
        address, // Sender address
        STAKER_CONTRACT_ADDRESS, // Contract address
        claimMsg, // Execute message
        {
          amount: [{ denom: "ujunox", amount: "7500" }], // fee
          gas: "3000000", // gas limit
        }
      );
      const balancesResult = await getBalances(address);
      setBalances(balancesResult);
      const stakersResult = await queryStakers(address);
      setStakers(stakersResult);
      setClaimableRewards(0); // Reset claimable rewards after claiming
      setConfetti(true);
      toast.success("Rewards claimed successfully!");
    } catch (err) {
      setError(err);
      toast.error("Error claiming rewards");
      console.error("Error executing claim rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  const customStyles = {
    content: {
      top: "52%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      backgroundColor: useColorModeValue("white", "rgba(52, 52, 52, 1)"),
      color: useColorModeValue("black", "white"),
      borderRadius: "15px",
      height: "20%",
      width: "300px",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
    },
  };

  if (loading || !signingClient || !config || !staker || !balances) {
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
  return (
    <Box
      width="100%"
      maxW="500px"
      mx="auto"
      mt="50px"
      p="20px"
      borderRadius="10px"
      borderWidth="1px"
    >
      {claimableRewards > 0 && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          style={customStyles}
        >
          <button
            onClick={() => setModalIsOpen(false)}
            style={{
              position: "absolute",
              right: "20px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <CloseIcon color={inputColor} />
          </button>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            marginTop="30px"
          >
            <Box textAlign="center" fontSize={20}>
              You have {claimableRewards} WattPeak ready to be claimed!
            </Box>
            <br />
            <Button
              onClick={handleClaimRewards}
              background="linear-gradient(180deg, #FFD602 0%, #FFA231 100%)"
              color="black"
              borderRadius={50}
              padding={10}
              width={230}
              height={50}
              fontSize={18}
              cursor="pointer"
            >
              Claim Rewards
            </Button>
          </Box>
        </Modal>
      )}

      {confetti && <Confetti numberOfPieces={3000} recycle={false} />}
      <Tabs variant="enclosed">
        <TabList className="tabListStaking">
          <Tab
            className="stakeTab"
            borderColor={inputColor}
            color={inputColor}
            background={backgroundColor}
            _selected={{
              background: "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
              color: "black",
              transform: "translateX(0px)",
              transition: "transform 0.3s ease",
              zIndex: 2,
            }}
          >
            Stake
          </Tab>
          <Tab
            className="stakeTab"
            borderColor={inputColor}
            color={inputColor}
            background={backgroundColor}
            _selected={{
              background: "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
              color: "black",
              transform: "translateX(0px)",
              transition: "transform 0.3s ease",
              zIndex: 2,
            }}
          >
            Unstake
          </Tab>
        </TabList>

        <TabPanels className="tabPanelsStaking">
          <TabPanel>
            <Box
              className="inputWrapperStaker"
              backgroundColor={backgroundColor}
            >
              <div className="stakingBalanceWrapper">
                <p>Wattpeak balance: {wattpeakBalance}</p>
                <Button
                  onClick={() => setAmount(wattpeakBalance)}
                  mb="10px"
                  className="maxButtonStaking"
                >
                  Max
                </Button>
              </div>
              <Input
                type="number"
                value={amount}
                className="inputStaking"
                color={inputColor}
                onChange={(e) =>
                  setAmount(
                    Math.min(parseFloat(e.target.value), wattpeakBalance)
                  )
                }
                max={wattpeakBalance}
                min="1"
                step="1"
                placeholder="Amount"
              />
            </Box>
            <Box className="stakeDetails" backgroundColor={backgroundColor}>
              <h3>You will stake {amount} WattPeak</h3>
              <p>Current ROI: {config.rewards_percentage * 100} % per year</p>
              <p>
                Reward:{" "}
                {parseFloat((amount * config.rewards_percentage).toFixed(6))
                  .toString()
                  .replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")}{" "}
                WattPeak per year
              </p>
            </Box>
            <Center>
              <Button
                onClick={handleStake}
                disabled={loading}
                className="stakeBtn"
              >
                {loading ? <Spinner /> : "STAKE"}
              </Button>
            </Center>
          </TabPanel>
          <TabPanel>
            <Box
              className="inputWrapperStaker"
              backgroundColor={backgroundColor}
            >
              <div className="stakingBalanceWrapper">
                <p>Staked Wattpeak: {stakedWattpeak}</p>
                <Button
                  onClick={() => setAmount(stakedWattpeak)}
                  mb="10px"
                  className="maxButtonStaking"
                >
                  Max
                </Button>
              </div>
              <Input
                className="inputStaking"
                type="number"
                value={amount}
                color={inputColor}
                onChange={(e) =>
                  setAmount(
                    Math.min(parseFloat(e.target.value), stakedWattpeak)
                  )
                }
                min="1"
                max={stakedWattpeak}
                step="1"
                placeholder="Amount"
              />
            </Box>
            <Box className="stakeDetails" backgroundColor={backgroundColor}>
              <h3>You will unstake {amount} WattPeak</h3>
            </Box>
            <Center>
              <Button
                onClick={handleUnstake}
                disabled={loading}
                className="stakeBtn"
              >
                {loading ? <Spinner /> : "UNSTAKE"}
              </Button>
            </Center>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Staking;
