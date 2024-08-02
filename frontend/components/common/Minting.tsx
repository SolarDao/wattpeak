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
import { Button, Input } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Carousel from "react-multi-carousel";
import { Loading } from "./Loading";
import { queryNftConfig } from "@/utils/queryAndMintNft";
import { responsive } from "@/styles/responsiveCarousel";
import { handleMint } from "@/utils/handleMint";
import { useMediaQuery } from "react-responsive";

const nftContractAddress =
  process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS;
const wattPeakDenom = process.env.NEXT_PUBLIC_WATTPEAK_DENOM;

export const Minting = ({ chainName }: { chainName: string }) => {
  const wallet = useWallet();
  const walletName = wallet?.wallet?.name ?? "";
  const inputColor = useColorModeValue("black", "white");
  const borderColor = useColorModeValue("black", "white");
  interface Config {
    minting_price: {
      amount: string;
      denom: string;
    };
    minting_fee_percentage: number;
    // Add other properties as needed
  }

  const [config, setConfig] = useState<Config | null>(null);
  const [amount, setAmount] = useState(1);
  const [balances, setBalances] = useState<string[]>([]);
  const [price, setPrice] = useState("0");
  const [signingClient, setSigningClient] = useState(null);
  const [minting, setMinting] = useState(false);
  interface Project {
    projectId: number;
    name: string;
    max_wattpeak: number;
    minted_wattpeak_count: number;
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [junoBalance, setJunoBalance] = useState(0);
  const [wattpeakBalance, setWattpeakBalance] = useState(0);
  const hasRunQuery = useRef(false);
  const [error, setError] = useState(null);
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );

  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(
    chainName,
    walletName
  );

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

  const handleAmountChange = (e) => {
    let newAmount = e.target.value;

    // Restrict to 6 decimal places
    if (newAmount.includes(".")) {
      const parts = newAmount.split(".");
      if (parts[1].length > 6) {
        newAmount = `${parts[0]}.${parts[1].slice(0, 6)}`;
      }
    }

    setAmount(newAmount);
    if (!isNaN(newAmount) && newAmount !== "") {
      setCryptoAmount(
        (parseFloat(newAmount) * config.minting_price.amount)
          .toFixed(6)
          .replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")
      );
    } else {
      setCryptoAmount("");
    }
  };

  const handleCryptoAmountChange = (e) => {
    let newCryptoAmount = e.target.value;

    // Restrict to 6 decimal places
    if (newCryptoAmount.includes(".")) {
      const parts = newCryptoAmount.split(".");
      if (parts[1].length > 6) {
        newCryptoAmount = `${parts[0]}.${parts[1].slice(0, 6)}`;
      }
    }

    setCryptoAmount(newCryptoAmount);
    if (!isNaN(newCryptoAmount) && newCryptoAmount !== "") {
      setAmount(
        (parseFloat(newCryptoAmount) / config.minting_price.amount)
          .toFixed(6)
          .replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")
      );
    } else {
      setAmount("");
    }
  };

  const handleMaxClick = () => {
    setCryptoAmount(
      junoBalance.toFixed(6).replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")
    );
    setAmount(
      (junoBalance / config.minting_price.amount)
        .toFixed(6)
        .replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")
    );
  };

  const handleBlurAmount = () => {
    setAmount(
      parseFloat(amount)
        .toString()
        .replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")
    );
  };

  const handleBlurCryptoAmount = () => {
    setCryptoAmount(
      parseFloat(cryptoAmount)
        .toString()
        .replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1")
    );
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await queryProjects();
        const projectsWithId = result.map((project, index) => ({
          ...project,
          projectId: index + 1,
        }));
        setProjects(projectsWithId);
      } catch (err) {
        setError(err);
        console.error("Error querying the projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  function setCorrectBalances(balances: string[]) {
    setJunoBalance(
      balances?.find((balance) => balance.denom === "ujunox")?.amount /
        1000000 || 0
    );
    setWattpeakBalance(
      balances?.find((balance) => balance.denom === wattPeakDenom)?.amount /
        1000000 || 0
    );
  }

  useEffect(() => {
    const fetchConfig = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();
          setSigningClient(client);
          if (!config) {
            await queryNftConfig().then((result) => {
              setConfig(result);

              setCryptoAmount(result.minting_price.amount);
            });
          }
          hasRunQuery.current = true;
          await getBalances(address).then((result) => {
            setBalances(result);
          });
          setCorrectBalances(balances);
        } catch (err) {
          setError(err);
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
        <div className="headerBox">
          <h3>Available Projects to mint</h3>
          {!isMobile && (
            <p>
              Price per wattpeak: {config?.minting_price.amount}{" "}
              {config?.minting_price.denom}
            </p>
          )}
        </div>
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
                parseFloat(cryptoAmount) +
                cryptoAmount * config?.minting_fee_percentage
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
