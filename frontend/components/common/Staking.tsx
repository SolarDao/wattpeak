import React, { useEffect, useState } from "react";
import { useChain } from "@cosmos-kit/react";
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Box,
  Button,
  Input,
  Center,
  Heading,
  Tooltip,
  border,
  GridItem,
  Grid,
} from "@chakra-ui/react";
import { Spinner, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "../../utils/balances/junoBalances";
import { queryStakers } from "@/utils/queries/queryStaker";
import { queryStakingConfig } from "@/utils/queries/queryStakingConfig";
import Confetti from "react-confetti";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { CloseIcon } from "@chakra-ui/icons";
import { Loading } from "./helpers/Loading";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { WalletStatus } from "cosmos-kit";
import { formatBalance } from "@/utils/balances/formatBalances";
import { queryTotalInterestWattpeak } from "@/utils/queries/queryTotalInterestWattpeak";

const STAKER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_WATTPEAK_STAKER_CONTRACT_ADDRESS;

const wattPeakDenom = process.env.NEXT_PUBLIC_WATTPEAK_DENOM || "";

interface Config {
  rewards_percentage: number;
  // Add any other properties you expect in config
}

export const Staking = ({ chainName }: { chainName: string }) => {
  const { connect, status, address, getSigningCosmWasmClient, wallet } =
    useChain(chainName);

  const [amount, setAmount] = useState(0.0);
  const [staker, setStakers] = useState<{
    wattpeak_staked: number;
    claimable_rewards: number;
    interest_wattpeak: number;
  }>({ wattpeak_staked: 0, claimable_rewards: 0, interest_wattpeak: 0 });
  const [balances, setBalances] = useState<any[]>([]);
  const [signingClient, setSigningClient] =
    useState<SigningCosmWasmClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | Error>(null);
  const [confetti, setConfetti] = useState(false);
  const [claimableRewards, setClaimableRewards] = useState(0);
  const [config, setConfig] = useState<Config | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const wattpeakBalance =
    balances.length > 0 && wattPeakDenom
      ? (balances.find((balance: any) => balance.denom === wattPeakDenom)
          ?.amount || 0) / 1000000
      : 0;

  const stakedWattpeak = staker.wattpeak_staked / 1000000;
  const interestWattpeakEarned = (
    formatBalance(staker.interest_wattpeak) || 0)
  const [totalInterestWattpeak, setTotalInterestWattpeak] = useState(0);
  const borderColor = useColorModeValue("black", "white");

  const inputColor = useColorModeValue("#000000B2", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );

  useEffect(() => {
    const fetchClient = async () => {
      if (status === WalletStatus.Connected && address) {
        try {
          setLoading(true);

          // Start all fetch operations simultaneously
          const clientPromise = getSigningCosmWasmClient();
          const balancesPromise = getBalances(address);
          const stakersPromise = queryStakers(address);
          const configPromise = queryStakingConfig();
          const totalInterestWattpeakPromise = queryTotalInterestWattpeak();

          // Wait for all promises to resolve
          const [
            client,
            balancesResult,
            stakersResult,
            configResult,
            totalInterestWattpeakResult,
          ] = await Promise.all([
            clientPromise,
            balancesPromise,
            stakersPromise,
            configPromise,
            totalInterestWattpeakPromise,
          ]);

          setSigningClient(client as any);
          setBalances([...balancesResult] as any[]);
          setStakers(
            stakersResult || { wattpeak_staked: 0, claimable_rewards: 0 }
          );
          setConfig(configResult);

          // Handle claimable rewards
          const claimable = stakersResult.claimable_rewards / 1000000;
          setClaimableRewards(claimable);
          setTotalInterestWattpeak(
            parseFloat((totalInterestWattpeakResult / 1000000).toFixed(6))
          );
          if (claimable > 0) {
            setModalIsOpen(true);
          }
        } catch (err) {
          setError(err as Error);
          toast.error("Error fetching staking data");
          console.error("Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Reset state when wallet is not connected
        setSigningClient(null);
        setBalances([]);
        setStakers({
          wattpeak_staked: 0,
          claimable_rewards: 0,
          interest_wattpeak: 0,
        });
        setConfig(null);
        setLoading(false);
      }
    };

    fetchClient();
  }, [status, address, getSigningCosmWasmClient]);

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
      await signingClient.execute(
        address as string,
        STAKER_CONTRACT_ADDRESS as string,
        stakeMsg,
        {
          amount: [{ denom: "ujunox", amount: "7500" }],
          gas: "3000000",
        },
        "",
        [{ denom: wattPeakDenom, amount: (amount * 1000000).toString() }]
      );

      // Fetch updated balances and staker info in parallel
      const [balancesResult, stakersResult] = await Promise.all([
        getBalances(address),
        queryStakers(address || ""),
      ]);

      setBalances([...balancesResult] as any[]);
      setStakers(stakersResult);
      setClaimableRewards(stakersResult.claimable_rewards / 1000000);
      setAmount(0);
      toast.success("Tokens staked successfully!");
    } catch (err) {
      setError(err as Error);
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
        address as string, // Sender address
        STAKER_CONTRACT_ADDRESS as string, // Contract address
        unstakeMsg, // Execute message
        {
          amount: [{ denom: "ujunox", amount: "7500" }], // fee
          gas: "3000000", // gas limit
        }
      );
      const balancesResult = await getBalances(address);
      setBalances([...balancesResult]);
      const stakersResult = await queryStakers(address || "");
      setStakers(stakersResult);
      setClaimableRewards(stakersResult.claimable_rewards); // Update claimable rewards
      setAmount(0);
      toast.success("Tokens unstaked successfully!");
    } catch (err) {
      setError(err as Error);
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
        address as string, // Sender address
        STAKER_CONTRACT_ADDRESS as string, // Contract address
        claimMsg, // Execute message
        {
          amount: [{ denom: "ujunox", amount: "7500" }], // fee
          gas: "3000000", // gas limit
        }
      );
      const balancesResult = await getBalances(address);
      setBalances([...balancesResult]);
      const stakersResult = await queryStakers(address || "");
      setStakers(stakersResult);
      setClaimableRewards(0); // Reset claimable rewards after claiming
      setConfetti(true);
      toast.success("Rewards claimed successfully!");
    } catch (err) {
      setError(err as Error);
      toast.error("Error claiming rewards");
      console.error("Error executing claim rewards:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setConfetti(false), 6000);
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
      height: "200px",
      width: "300px",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
    },
  };

  if (loading || !config) {
    return <Loading />;
  }

  return (
    <Box
      width="100%"
      maxW="500px"
      mx="auto"
      mt="25px"
      p="20px"
      borderRadius="10px"
      borderWidth="1px"
    >
      <Heading
        fontSize="30px"
        color={inputColor}
        marginBottom="15px"
        marginTop="10px"
        textAlign="center"
      >
        WattPeak Staker
      </Heading>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        margin="auto"
        justifyContent="center"
        marginBottom="25px"
        width="70%"
        borderRadius="23px"
        padding="10px"
        backgroundColor={backgroundColor}
        color={inputColor}
        boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
      >
        {/* Grid Layout for Label-Value Pairs */}
        <Grid templateColumns="2.5fr 1fr" gap={7} width="100%" paddingLeft="20px" paddingRight="20px">
          {/* $IWP Earned */}
          <GridItem>
            <Text fontSize="15px" textAlign="left" margin="0">
              Earned $IWP:
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="15px" fontWeight="bold" textAlign="right" margin="0">
              {interestWattpeakEarned}
            </Text>
          </GridItem>

          {/* Total $IWP (Global) */}
          <GridItem>
            <Text fontSize="15px" textAlign="left" margin="0">
              Total $IWP (Global):
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="15px" fontWeight="bold" textAlign="right" margin="0"> 
              {totalInterestWattpeak}
            </Text>
          </GridItem>

          {/* Current share of Rewards */}
          <GridItem>
            <Text fontSize="15px" textAlign="left" margin="0">
             Share of Rewards:
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="15px" fontWeight="bold" textAlign="right" margin="0">
              {(
                (parseFloat(interestWattpeakEarned.toString()) / totalInterestWattpeak) *
                100
              ).toFixed(2)}{" "}
              %
            </Text>
          </GridItem>

          {/* Current ROI per year */}
          <GridItem>
            <Text fontSize="15px" textAlign="left" margin="0">
              ROI per year:
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="15px" fontWeight="bold" textAlign="right" margin="0">
              {config.rewards_percentage * 100} %
            </Text>
          </GridItem>

          {/* Claimable Rewards */}
          <GridItem>
            <Text fontSize="15px" textAlign="left" margin="0">
              Claimable $WP:
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="15px" fontWeight="bold" textAlign="right" margin="0">
              {formatBalance(claimableRewards)}
            </Text>
          </GridItem>

          {/* Rewards fee */}
          <GridItem>
            <Text fontSize="15px" textAlign="left" margin="0">
              Rewards fee:
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="15px" fontWeight="bold" textAlign="right" margin="0">
              5 %
            </Text>
          </GridItem>
        </Grid>
      </Box>

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
              You have {formatBalance(claimableRewards)} $WP ready to be
              claimed!
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
      <Tabs variant="enclosed" onChange={() => setAmount(0)}>
        <TabList className="tabListStaking">
          <Tooltip
            color={inputColor}
            label="Stake $WP to Earn $IWP"
            aria-label="Osmosis Tooltip"
            placement="top"
          >
            <Tab
              className="stakeTab"
              borderColor={inputColor}
              color={inputColor}
              background={backgroundColor}
              boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
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
          </Tooltip>
          <Tooltip
            color={inputColor}
            label="Unstake Your Staked $WP"
            aria-label="Osmosis Tooltip"
            placement="top"
          >
            <Tab
              className="stakeTab"
              boxShadow="0px 2px 4px rgba(0, 0, 0, 0.5)"
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
          </Tooltip>
        </TabList>

        <TabPanels className="tabPanelsStaking">
          <TabPanel>
            <Box
              className="inputWrapperStaker"
              backgroundColor={backgroundColor}
              boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
            >
              <Box className="stakingBalanceWrapper">
                <Text>Balance: {wattpeakBalance} $WP</Text>
                <Button
                  onClick={() => setAmount(wattpeakBalance)}
                  mb="10px"
                  className="maxButtonStaking"
                  color={inputColor}
                  backgroundColor={backgroundColor}
                  borderColor={borderColor}
                >
                  Max
                </Button>
              </Box>
              <Input
                type="number"
                value={amount}
                className="inputStaking"
                color={inputColor}
                onChange={(e) => {
                  const inputValue = parseFloat(e.target.value);
                  setAmount(
                    Math.min(Math.max(inputValue, 0), wattpeakBalance) // Ensure inputValue is not less than zero
                  );
                }}
                max={wattpeakBalance}
                min="1"
                step="1"
                placeholder="Amount"
              />
            </Box>
            {amount > 0 && (
              <>
                <Box
                  className="stakeDetails"
                  backgroundColor={backgroundColor}
                  boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
                >
                  <Heading fontSize="20px">You will stake {amount} $WP</Heading>
                  <Text>
                    Reward:{" "}
                    {parseFloat((amount * config.rewards_percentage).toFixed(6))
                      .toString()
                      .replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")}{" "}
                    $IWP per year
                  </Text>
                </Box>
                <Center>
                  <Button
                    onClick={handleStake}
                    disabled={loading}
                    className="mintBtn"
                    width="50%"
                    borderColor={borderColor}
                    backgroundColor={backgroundColor}
                    color={inputColor}
                  >
                    {loading ? <Spinner /> : "STAKE"}
                  </Button>
                </Center>
              </>
            )}
          </TabPanel>
          <TabPanel>
            <Box
              className="inputWrapperStaker"
              backgroundColor={backgroundColor}
              boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
            >
              <Box className="stakingBalanceWrapper">
                <p>Staked: {stakedWattpeak} $WP</p>
                <Button
                  onClick={() => setAmount(stakedWattpeak)}
                  mb="10px"
                  className="maxButtonStaking"
                  color={inputColor}
                  backgroundColor={backgroundColor}
                  borderColor={borderColor}
                >
                  Max
                </Button>
              </Box>
              <Input
                className="inputStaking"
                type="number"
                value={amount}
                color={inputColor}
                onChange={(e) =>
                  setAmount(
                    Math.min(
                      parseFloat(e.target.value),
                      staker.wattpeak_staked / 1000000
                    )
                  )
                }
                min="1"
                max={staker.wattpeak_staked / 1000000}
                step="1"
                placeholder="Amount"
              />
            </Box>
            {amount > 0 && (
              <>
                <Box
                  className="stakeDetails"
                  backgroundColor={backgroundColor}
                  boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
                >
                  <Heading fontSize="20px">
                    You will unstake {amount} $WP{" "}
                  </Heading>
                  <Text>You won&apos;t earn any $IWP for today </Text>
                </Box>
                <Center>
                  <Button
                    onClick={handleUnstake}
                    disabled={loading}
                    className="mintBtn"
                    width="50%"
                    borderColor={borderColor}
                    backgroundColor={backgroundColor}
                    color={inputColor}
                  >
                    {loading ? <Spinner /> : "UNSTAKE"}
                  </Button>
                </Center>
              </>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Staking;
