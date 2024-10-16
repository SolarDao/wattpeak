import React, { useEffect, useRef, useState } from "react";
import { useChain } from "@cosmos-kit/react";
import { Box, Container, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "@/utils/balances/junoBalances";
import { queryProjects } from "../../utils/queries/queryProjects";
import "react-multi-carousel/lib/styles.css";
import Image from "next/image";
import { Button, Heading, Input, Text, Tooltip } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Carousel from "react-multi-carousel";
import { Loading } from "./helpers/Loading";
import { queryNftConfig } from "@/utils/queries/queryAndMintNft";
import { responsive } from "@/styles/responsiveCarousel";
import { handleMint } from "@/utils/swap-functions/handleMint";
import { useMediaQuery } from "react-responsive";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { toast } from "react-toastify";
import { formatDenom } from "@/utils/balances/formatDenoms";
import { formatBalance } from "@/utils/balances/formatBalances";

const nftContractAddress =
  process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS || "";
const wattPeakDenom = process.env.NEXT_PUBLIC_WATTPEAK_DENOM || "";

export const Minting = ({ chainName }: { chainName: string }) => {
  const inputColor = useColorModeValue("#000000B2", "white");
  const borderColor = useColorModeValue("black", "white");
  interface Config {
    minting_price: {
      amount: any;
      denom: string;
    };
    minting_fee_percentage: number;
    // Add other properties as needed
  }

  interface Balance {
    denom: string;
    amount: number;
  }

  interface Project {
    projectId: number;
    name: string;
    max_wattpeak: number;
    minted_wattpeak_count: number;
  }

  const { status, address, getSigningCosmWasmClient } = useChain(chainName);
  const [config, setConfig] = useState<Config | null>(null);
  const [amount, setAmount] = useState<number>(0.95);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [price, setPrice] = useState("0");
  const [signingClient, setSigningClient] =
    useState<SigningCosmWasmClient | null>(null);
  const [minting, setMinting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [cryptoAmount, setCryptoAmount] = useState<number>(1);
  const [junoBalance, setJunoBalance] = useState(0);
  const [wattpeakBalance, setWattpeakBalance] = useState(0);
  const [mintingFeeAmount, setMintingFeeAmount] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const handleMintClick = async () => {
    if (!signingClient || !address) {
      toast.error("Wallet not connected");
      return;
    }
    // Proceed with handleMint function
    await handleMint({
      signingClient,
      address,
      amount,
      selectedProjectId,
      price,
      nftContractAddress,
      queryProjects,
      getBalances: getBalances as (address: string) => Promise<any[]>,
      setProjects,
      setBalances,
      setJunoBalance,
      setWattpeakBalance,
      setError,
      setMinting,
      balances,
    });
  };
  const handleAmountChange = (e: { target: { value: any } }) => {
    let newAmount = e.target.value;

    // Restrict to 6 decimal places
    if (newAmount.includes(".")) {
      const parts = newAmount.split(".");
      if (parts[1].length > 6) {
        newAmount = `${parts[0]}.${parts[1].slice(0, 6)}`;
      }
    }

    const parsedAmount = parseFloat(newAmount);

    setAmount(parsedAmount);

    if (!isNaN(parsedAmount) && newAmount !== "" && config) {
      // Convert minting price from micro-units to standard units (Juno)
      const mintingPriceInJuno =
        parseFloat(config.minting_price.amount) / 1_000_000;

      if (mintingPriceInJuno === 0) {
        setCryptoAmount(0);
      } else {
        // Parse the minting fee percentage
        const mintingFeePercentage = parseFloat(
          config.minting_fee_percentage.toString()
        ); // e.g., 0.05 for 5%

        // Calculate the total cost per WattPeak including the minting fee
        const totalCostPerWp = mintingPriceInJuno * (1 + mintingFeePercentage);

        // Calculate the total cost including minting fee
        const totalCost = parsedAmount * totalCostPerWp;

        setCryptoAmount(parseFloat(totalCost.toFixed(6))); // Optional: restrict to 6 decimal places
      }
    } else {
      setCryptoAmount(0); // Set to 0 or another default value
    }
  };

  const handleCryptoAmountChange = (e: { target: { value: any } }) => {
    let newCryptoAmount = e.target.value;

    // Restrict to 6 decimal places
    if (newCryptoAmount.includes(".")) {
      const parts = newCryptoAmount.split(".");
      if (parts[1].length > 6) {
        newCryptoAmount = `${parts[0]}.${parts[1].slice(0, 6)}`;
      }
    }

    const parsedCryptoAmount = parseFloat(newCryptoAmount);

    setCryptoAmount(parsedCryptoAmount);

    if (!isNaN(parsedCryptoAmount) && newCryptoAmount !== "" && config) {
      // Convert minting price from micro-units to standard units (Juno)
      const mintingPriceInJuno =
        parseFloat(config.minting_price.amount) / 1_000_000;

      if (mintingPriceInJuno === 0) {
        setAmount(0);
      } else {
        // Parse the minting fee percentage
        const mintingFeePercentage = parseFloat(
          config.minting_fee_percentage.toString()
        );

        // Calculate the total cost per WattPeak including the minting fee
        const totalCostPerWp = mintingPriceInJuno * (1 + mintingFeePercentage);

        // Calculate the net amount of WattPeak
        const netAmount = parsedCryptoAmount / totalCostPerWp;

        // Update the amount state
        setAmount(parseFloat(netAmount.toFixed(6)));
      }
    } else {
      setAmount(0);
    }
  };

  const calculateMax = () => {
    // Parse configuration values
    const mintingPricePerWp = parseFloat(config?.minting_price.amount); // in uJunox per Wp
    const mintingFeePercentage =
      config?.minting_fee_percentage !== undefined
        ? parseFloat(config.minting_fee_percentage.toString())
        : 0; // e.g., 0.05 for 5%

    if (mintingPricePerWp === 0) {
      console.error("Minting price cannot be zero.");
      setAmount(0);
      setCryptoAmount(0);
      return;
    }

    // Calculate the total cost per Wp, including the minting fee
    const totalCostPerWp = mintingPricePerWp * (1 + mintingFeePercentage);

    // Calculate the maximum amount of Wp that can be minted with the available Juno balance
    const maxWp = ((junoBalance / totalCostPerWp) * 1_000_000).toFixed(6); // Convert to micro units

    return parseFloat(maxWp);
  };

  const handleMaxClick = () => {
    if (!config || !config.minting_price || !config.minting_fee_percentage) {
      console.error("Configuration is incomplete.");
      setAmount(0);
      setCryptoAmount(0);
      return;
    }

    const maxWp = calculateMax();

    // Update the state with the calculated values
    setAmount(Number(maxWp));
    setCryptoAmount(junoBalance - 0.002); // Convert to standard units (Juno)
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await queryProjects();
        const projectsWithId = result.map((project: any, index: number) => ({
          ...project,
          projectId: index + 1,
        }));
        setProjects(projectsWithId);
      } catch (err) {
        setError(err as Error);
        console.error("Error querying the projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  function setCorrectBalances(balances: any) {
    setJunoBalance(
      balances?.find((balance: { denom: string }) => balance.denom === "ujunox")
        ?.amount / 1000000 || 0
    );
    setWattpeakBalance(
      balances?.find(
        (balance: { denom: string }) => balance.denom === wattPeakDenom
      )?.amount / 1000000 || 0
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Initiate all fetch operations
        const [projectsResult, configResult] = await Promise.all([
          queryProjects(),
          queryNftConfig(),
        ]);

        // Process projects
        const projectsWithId = projectsResult.map(
          (project: any, index: number) => ({
            ...project,
            projectId: index + 1,
          })
        );
        setProjects(projectsWithId);

        // Set config
        setConfig(configResult);

        // Set crypto amount based on config
        setCryptoAmount(
          parseFloat(configResult.minting_price.amount) / 1000000
        );
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching projects or config:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (status === "Connected" && address) {
        try {
          setLoading(true);

          // Fetch signing client and balances in parallel
          const [client, balancesResult] = await Promise.all([
            getSigningCosmWasmClient(),
            getBalances(address),
          ]);

          setSigningClient(client as unknown as SigningCosmWasmClient);
          setBalances(balancesResult as unknown as Balance[]);
          setCorrectBalances(balancesResult);
        } catch (err) {
          setError(err as Error);
          console.error("Error fetching balances:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Wallet is not connected
        setSigningClient(null);
        setBalances([]);
        setJunoBalance(0);
        setWattpeakBalance(0);
        setLoading(false);
      }
    };

    fetchBalances();
  }, [status, address, getSigningCosmWasmClient],);

  useEffect(() => {
    if (config && amount) {
      // Convert minting price from micro-units to standard units (JUNO)
      const mintingPriceInJuno =
        parseFloat(config.minting_price.amount);

      // Parse the minting fee percentage
      const mintingFeePercentage = parseFloat(
        config.minting_fee_percentage.toString()
      );

      // Check for zero minting price to prevent division errors
      if (mintingPriceInJuno === 0) {
        console.error("Minting price cannot be zero.");
        setPrice("0");
        setMintingFeeAmount(0);
        return;
      }

      // Calculate the base cost (without fee)
      const baseCost = amount * mintingPriceInJuno;

      // Calculate the minting fee amount
      const feeAmount = baseCost * mintingFeePercentage;

      // Calculate the total cost including minting fee
      const totalCost = baseCost + feeAmount;

      // Set the price state
      setPrice(totalCost.toFixed(6));

      // Set the minting fee amount state
      setMintingFeeAmount(parseFloat((feeAmount).toFixed(6))); // No division needed
    } else {
      setPrice("0"); // Default to 0 if config or amount is not available
      setMintingFeeAmount(0);
    }
  }, [amount, config]);

  if (loading || !config || !projects.length || minting) {
    return <Loading />;
  }

  return (
    <Container>
      <Box mt={10} width="100%" margin="auto">
        <Box
          className="headerBox"
          display="flex"
          justifyContent={isMobile ? "center" : "space-between"}
          marginBottom="5px"
          marginRight="25px"
          marginLeft="10px"
        >
          <Heading
            display={"flex"}
            gap={"5px"}
            justifyContent="center"
            marginBottom="0px"
            marginTop="57px"
            color={inputColor}
            fontSize="24px"
            fontWeight="500"
            lineHeight="19.36px"
            marginLeft="10px"
          >
            <Box paddingTop="10px">Solar Parks</Box>
            <Image
              src={require("../../images/solar-panel.png")}
              width={24}
              alt={"Hallo"}
              style={{ marginTop: "7px" }}
            />
          </Heading>{" "}
          <Heading
            fontSize="30px"
            fontWeight="500"
            color={inputColor}
            marginBottom="40px"
            marginTop="20px"
            textAlign="center"
            paddingLeft={isMobile ? "0px" : "15px"}
          >
            WattPeak Minter
          </Heading>
          {!isMobile && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              backgroundColor={backgroundColor}
              borderRadius="13px"
              padding="10px"
              marginTop="35px"
              height="fit-content"
              boxShadow="0px 1px 2px rgba(0, 0, 0, 0.5)"
              gap={10}
            >
              <Box fontSize="12px" textAlign="center" marginBottom="3px">
                Price per $WP: {formatBalance(config?.minting_price.amount)}{" "}
                {formatDenom(config?.minting_price.denom)}
              </Box>

              <Box fontSize="12px" textAlign="center" marginBottom="3px">
                Minting Fee: {config?.minting_fee_percentage * 100}%
              </Box>
            </Box>
          )}
        </Box>
        <Carousel
          responsive={responsive}
          infinite={true}
          arrows={true}
          containerClass="carousel-container"
        >
          {!projects.length && <p>No projects available to mint</p>}
          {projects.map((project) => (
            <Box
              key={project.projectId}
              className="project-card"
              backgroundColor={backgroundColor}
            >
              <Image src={require("../../images/panel.png")} alt={"Hallo"} />
              <Box className="project-details">
                <Text fontSize="18px">{project.name}</Text>
                <Text fontSize="14px">
                  Available $WP:{" "}
                  {(project.max_wattpeak - project.minted_wattpeak_count) /
                    1000000}
                </Text>
                <Button
                  className={
                    selectedProjectId === project.projectId
                      ? "projectButtonSelected"
                      : "projectButton"
                  }
                  color={
                    selectedProjectId === project.projectId
                      ? "black"
                      : inputColor
                  }
                  //boxShadow={boxShadow}
                  borderColor={borderColor}
                  onClick={() => setSelectedProjectId(project.projectId)}
                >
                  {selectedProjectId === project.projectId
                    ? "Selected"
                    : "Select"}
                </Button>
              </Box>
            </Box>
          ))}
        </Carousel>
      </Box>
      <Box className="mintBox">
        <Box
          className="inputWrapper"
          backgroundColor={backgroundColor}
          boxShadow="0px 1px 2px rgba(0, 0, 0, 0.5)"
        >
          <Box className="balanceWrapper">
            <Text as="span">Juno</Text>
            <br />
            <Text as="span" className="balance">
              Balance: {junoBalance}
            </Text>
          </Box>
          <Button
            onClick={handleMaxClick}
            className="maxButtonMinting"
            color={inputColor}
            borderColor={borderColor}
            backgroundColor={backgroundColor}
          >
            Max
          </Button>
          <Input
            type="number"
            value={cryptoAmount}
            className="mintJunoInput"
            onChange={handleCryptoAmountChange}
            //onBlur={handleBlurCryptoAmount}
            placeholder="Juno"
            min="1"
            max={junoBalance - 0.002}
            color={inputColor}
          />
        </Box>
        <ArrowForwardIcon className="arrowIcon" boxSize={30} />
        <Box
          className="inputWrapper"
          backgroundColor={backgroundColor}
          boxShadow="0px 1px 2px rgba(0, 0, 0, 0.5)"
        >
          <Box className="balanceWrapper">
            <Text as="span">WattPeak</Text>
            <br />
            <Text as="span" className="balance">
              Balance: {wattpeakBalance}
            </Text>
          </Box>
          <Input
            type="number"
            value={amount}
            className="mintWattpeakInput"
            onChange={handleAmountChange}
            //onBlur={handleBlurAmount}
            min="1"
            max={calculateMax()}
            placeholder="Wattpeak"
            color={inputColor}
          />
        </Box>
      </Box>
      <Box className="mintButtonDetailsBox">
        <Box
          className="priceDetails"
          backgroundColor={backgroundColor}
          boxShadow="0px 1px 2px rgba(0, 0, 0, 0.5)"
        >
          {/* Check for invalid conditions first */}
          {cryptoAmount === 0 ||
          isNaN(cryptoAmount) ||
          cryptoAmount == null ||
          amount === 0 ||
          isNaN(amount) ||
          amount == null ? (
            <Text color="red" fontSize="20px">
              No value can be zero
            </Text>
          ) : cryptoAmount > junoBalance || amount > (calculateMax() ?? 0) ? (
            <Text color="red" fontSize="20px">
              Insufficient balance
            </Text>
          ) : (
            <>
              <Text fontSize="20px" fontWeight={700}>
                You will pay {cryptoAmount}{" "}
                {formatDenom(config.minting_price.denom)} for {amount} Wattpeak
              </Text>
              <Text>
                Minting fee: {(mintingFeeAmount / 1000000).toFixed(6)}{" "}
                {formatDenom(config.minting_price.denom)}
              </Text>
            </>
          )}
        </Box>
        <Tooltip
          label={
            cryptoAmount > junoBalance
              ? "Insufficient Juno balance"
              : amount > (calculateMax() ?? 0)
              ? "Amount exceeds max Wattpeak"
              : !selectedProjectId
              ? "Please select a project"
              : "Ready to mint"
          }
          fontSize="20px"
          color={inputColor}
        >
          <Button
            onClick={handleMintClick}
            className="mintBtn"
            color={inputColor}
            borderColor={borderColor}
            backgroundColor={backgroundColor}
            isDisabled={
              cryptoAmount > junoBalance || amount > (calculateMax() ?? 0)
            }
          >
            MINT
          </Button>
        </Tooltip>
      </Box>
    </Container>
  );
};

export default Minting;
