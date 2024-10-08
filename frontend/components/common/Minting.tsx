import React, { useEffect, useRef, useState } from "react";
import { useChain } from "@cosmos-kit/react";
import {
  Box,
  Container,
  Spinner,
  useColorModeValue,
} from "@interchain-ui/react";
import { getBalances } from "@/utils/balances/junoBalances";
import { queryProjects } from "../../utils/queries/queryProjects";
import "react-multi-carousel/lib/styles.css";
import Image from "next/image";
import { Button, Heading, Input } from "@chakra-ui/react";
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
  const [amount, setAmount] = useState<number>(1);
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
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [junoBalance, setJunoBalance] = useState(0);
  const [wattpeakBalance, setWattpeakBalance] = useState(0);
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
    handleMint({
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

    setAmount(newAmount);
    if (!isNaN(parseFloat(newAmount)) && newAmount !== "") {
      const calculatedAmount =
        parseFloat(newAmount) *
        parseFloat(config?.minting_price?.amount || "0");
      setCryptoAmount(parseFloat(calculatedAmount.toFixed(6))); // Store as number
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

    setCryptoAmount(newCryptoAmount);
    if (!isNaN(newCryptoAmount) && newCryptoAmount !== "" && config) {
      setAmount(
        parseFloat(
          (
            parseFloat(newCryptoAmount) /
            parseFloat(config?.minting_price?.amount || "0")
          ).toFixed(6)
        )
      );
    } else {
      setAmount(0);
    }
  };

  const handleMaxClick = () => {
    const numericAmount = Number(amount);

    if (!isNaN(numericAmount)) {
      setAmount(Number(numericAmount.toFixed(6)));
    } else {
      console.error("Invalid amount: Cannot convert to number");
    }
    setAmount(
      parseFloat(
        (junoBalance / (config?.minting_price?.amount || 0)).toFixed(6)
      )
    ); // Set as number
    setCryptoAmount(junoBalance);
  };

  const handleBlurAmount = () => {
    // Convert amount to a number before calling toFixed
    const numericAmount = Number(amount);

    if (!isNaN(numericAmount)) {
      setAmount(Number(numericAmount.toFixed(6)));
    } else {
      console.error("Invalid amount: Cannot convert to number");
    }
  };

  const handleBlurCryptoAmount = () => {
    const numericAmount = Number(amount);
    if (!isNaN(numericAmount)) {
      setAmount(Number(numericAmount.toFixed(6)));
    } else {
      console.error("Invalid amount: Cannot convert to number");
    }
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
        setCryptoAmount(parseFloat(configResult.minting_price.amount));
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
  }, [status, address, getSigningCosmWasmClient]);

  useEffect(() => {
    let payable_amount = ((amount + amount * 0.05) * 5 * 1000000).toString();
    setPrice(payable_amount);
  }, [amount]);

  if (loading || !config || !projects.length || minting) {
    return <Loading />;
  }

  return (
    <Container>
      <Box mt={10} width="100%" margin="auto">
        <Heading
          fontSize="25px"
          color={inputColor}
          marginBottom="0px"
          marginTop="22px"
          textAlign="center"
          paddingLeft={isMobile ? "0px" : "15px"}
        >
          WattPeak Minter
        </Heading>
        <Box
          className="headerBox"
          display="flex"
          justifyContent={isMobile ? "center" : "space-between"}
          marginBottom="5px"
          marginRight="25px"
          marginLeft="10px"
        >
          <Box
            fontSize="20px"
            fontWeight={700}
            color={inputColor}
            marginTop="10px"
            paddingLeft={isMobile ? "0px" : "15px"}
          >
            Projects
          </Box>
          {!isMobile && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={10}
            >
              <Box fontSize="12px" textAlign="center" marginBottom="3px">
                Price per WP: {formatBalance(config?.minting_price.amount)}{" "}
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
              <div className="project-details">
                <p>{project.name}</p>
                <p>
                  Available WattPeak:{" "}
                  {(project.max_wattpeak - project.minted_wattpeak_count) /
                    1000000}
                </p>
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
                  borderColor={borderColor}
                  onClick={() => setSelectedProjectId(project.projectId)}
                >
                  {selectedProjectId === project.projectId
                    ? "Selected"
                    : "Select"}
                </Button>
              </div>
            </Box>
          ))}
        </Carousel>
      </Box>
      <Box className="mintBox">
        <Box className="inputWrapper" backgroundColor={backgroundColor}>
          <div className="balanceWrapper">
            <span>Juno</span>
            <br />
            <span className="balance">Balance: {junoBalance}</span>
          </div>
          <button onClick={handleMaxClick} className="maxButtonMinting">
            Max
          </button>
          <Input
            type="number"
            value={cryptoAmount}
            className="mintJunoInput"
            onChange={handleCryptoAmountChange}
            onBlur={handleBlurCryptoAmount}
            placeholder="Juno"
            min="1"
            max={junoBalance}
            color={inputColor}
          />
        </Box>
        <ArrowForwardIcon className="arrowIcon" boxSize={30} />
        <Box className="inputWrapper" backgroundColor={backgroundColor}>
          <div className="balanceWrapper">
            <span>Wattpeak</span> <br />
            <span className="balance">Balance: {wattpeakBalance}</span>
          </div>
          <Input
            type="number"
            value={amount}
            className="mintWattpeakInput"
            onChange={handleAmountChange}
            onBlur={handleBlurAmount}
            min="1"
            max={junoBalance / config?.minting_price.amount}
            placeholder="Wattpeak"
            color={inputColor}
          />
        </Box>
      </Box>
      <Box className="mintButtonDetailsBox">
        <Box className="priceDetails" backgroundColor={backgroundColor}>
          <h3>
            You will pay{" "}
            {parseFloat(
              (
                (Number(cryptoAmount) || 0) +
                (Number(cryptoAmount) || 0) *
                  (Number(config?.minting_fee_percentage) || 0)
              ).toFixed(6)
            ).toString()}{" "}
            uJunox for {amount} Wattpeak
          </h3>

          <p>
            Minting fee:{" "}
            {parseFloat(
              (cryptoAmount * config?.minting_fee_percentage).toFixed(6)
            ).toString()}{" "}
            uJunox
          </p>
        </Box>
        <button
          onClick={handleMintClick}
          disabled={minting}
          className="mintBtn"
        >
          MINT
        </button>
      </Box>
    </Container>
  );
};

export default Minting;
