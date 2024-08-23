import React, { useEffect, useRef, useState } from "react";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
import {
  Box,
  Container,
  Spinner,
  useColorModeValue,
} from "@interchain-ui/react";
import { getBalances } from "@/utils/balances/junoBalances";
import { queryProjects } from "../../utils/queryProjects";
import "react-multi-carousel/lib/styles.css";
import Image from "next/image";
import { Button, Heading, Input } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Carousel from "react-multi-carousel";
import { Loading } from "./Loading";
import { queryNftConfig } from "@/utils/queryAndMintNft";
import { responsive } from "@/styles/responsiveCarousel";
import { handleMint } from "@/utils/handleMint";
import { useMediaQuery } from "react-responsive";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const nftContractAddress =
  process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS || "";
const wattPeakDenom = process.env.NEXT_PUBLIC_WATTPEAK_DENOM || "";

export const Minting = ({ chainName }: { chainName: string }) => {
  const wallet = useWallet();
  const walletName = wallet?.wallet?.name ?? "";
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

  const [config, setConfig] = useState<Config | null>(null);
  const [amount, setAmount] = useState<number>(1);
  interface Balance {
    denom: string;
    amount: number;
  }

  const [balances, setBalances] = useState<Balance[]>([]);
  const [price, setPrice] = useState("0");
  const [signingClient, setSigningClient] =
    useState<SigningCosmWasmClient | null>(null);
  const [minting, setMinting] = useState(false);
  interface Project {
    projectId: number;
    name: string;
    max_wattpeak: number;
    minted_wattpeak_count: number;
  }

  const [projects, setProjects] = useState<Project[]>([]);
  // State for selected project ID
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [junoBalance, setJunoBalance] = useState(0);
  const [wattpeakBalance, setWattpeakBalance] = useState(0);
  const hasRunQuery = useRef(false);
  const [error, setError] = useState<Error | null>(null);
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );

  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(
    chainName,
    walletName
  );
  const addressValue = address ?? "";

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const handleMintClick = async () => {
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
    const fetchConfig = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client as unknown as SigningCosmWasmClient);
          if (!config) {
            await queryNftConfig().then((result) => {
              setConfig(result);

              setCryptoAmount(result.minting_price.amount);
            });
          }
          hasRunQuery.current = true;
          await getBalances(address).then((result) => {
            setBalances(result as any[]);
          });
          setCorrectBalances(balances);
        } catch (err) {
          setError(err as Error);
          console.error("Error querying the NFT contract:", err);
        } finally {
          setLoading(false);
        }
      } else {
        await connect();
        setLoading(false);
      }
    };

    fetchConfig();
  }, [status, getSigningCosmWasmClient, connect, balances, address, config]);

  useEffect(() => {
    let payable_amount = ((amount + amount * 0.05) * 5 * 1000000).toString();
    setPrice(payable_amount);
  }, [amount]);

  if (loading || !config || !junoBalance || !projects || !wattpeakBalance) {
    return <Loading />;
  }

  return (
    <Container>
      <Box>
        <Box
          className="headerBox"
          display="flex"
          justifyContent={isMobile ? "center" : "space-between"}
        >
          <Heading
            fontSize="20px"
            color={inputColor}
            marginBottom="5px"
            marginTop="20px"
            paddingLeft={isMobile ? "0px" : "15px"}
          >
            Available Projects to Mint
          </Heading>
          {!isMobile && (
            <Heading
              fontSize="20px"
              color={inputColor}
              marginBottom="5px"
              marginTop="20px"
              paddingRight="15px"
            >
              Price per wattpeak: {config?.minting_price.amount}{" "}
              {config?.minting_price.denom}
            </Heading>
          )}
        </Box>
        <Carousel responsive={responsive} infinite={false} arrows={true}>
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
                  color={inputColor}
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
          {minting ? <Spinner size="sm" color="black" /> : "MINT"}
        </button>
      </Box>
    </Container>
  );
};

export default Minting;
