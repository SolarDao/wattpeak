import React, { useEffect, useState } from "react";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
import { getCosmWasmClient } from "../../utils/junoSetup";
import {
  Box,
  Container,
  Spinner,
  useColorModeValue,
} from "@interchain-ui/react";
import { getBalances } from "@/utils/junoBalances";
import { queryProjects } from "../../utils/queryProjects";
import "react-multi-carousel/lib/styles.css";
import Image from "next/image";
import { setConfig } from "next/config";
import { Input } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Carousel from "react-multi-carousel";
import { get } from "http";

const nftContractAddress =
  process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS;

export async function queryNftConfig() {
  const client = await getCosmWasmClient();
  const queryMsg = { config: {} };
  const queryResult = await client.queryContractSmart(
    nftContractAddress,
    queryMsg
  );
  setConfig(queryResult);
  return queryResult;
}

export const Minting = ({ chainName }) => {
  let wallet = useWallet();
  let walletName = wallet?.wallet?.name ?? "";
  const inputColor = useColorModeValue("black", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );

  const { connect, status, address, getSigningCosmWasmClient } = useChainWallet(
    chainName,
    walletName
  );
  const [config, setConfig] = useState(null);
  const [amount, setAmount] = useState(1);
  const [balances, setBalances] = useState(null);
  const [price, setPrice] = useState("0");
  const [signingClient, setSigningClient] = useState(null);
  const [minting, setMinting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [junoBalance, setJunoBalance] = useState(0);
  const [wattpeakBalance, setWattpeakBalance] = useState(0);
  const [error, setError] = useState(null);

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
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 4,
      slidesToSlide: 4,
    },
    tablet: {
      breakpoint: { max: 1024, min: 600 },
      items: 2,
      slidesToSlide: 2,
    },
    mobile: {
      breakpoint: { max: 600, min: 0 },
      items: 1,
      slidesToSlide: 1,
    },
  };

  useEffect(() => {
    const fetchConfig = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();

          setSigningClient(client);

          await queryNftConfig().then((result) => {
            setConfig(result);
            setCryptoAmount(result.minting_price.amount);
          });
          await getBalances(address).then((result) => {
            setBalances(result);
          });
          setJunoBalance(
            balances?.find((balance) => balance.denom === "ujunox")?.amount /
              1000000 || 0
          );
          setWattpeakBalance(
            balances?.find(
              (balance) =>
                balance.denom ===
                "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka"
            )?.amount / 1000000 || 0
          );
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
  }, [status, getSigningCosmWasmClient, connect, balances, address]);

  useEffect(() => {
    let payable_amount = ((amount + amount * 0.05) * 5 * 1000000).toString();
    setPrice(payable_amount);
  }, [amount]);

  const handleMint = async () => {
    if (!signingClient) {
      console.error("Signing client not initialized");
      return;
    }
    if (!selectedProjectId) {
      alert("Please select a project to mint.");
      return;
    }
    setMinting(true);

    const mintMsg = {
      mint_tokens: {
        address: address, // User's address from Keplr
        amount: (amount * 1000000).toString(), // Adjust the amount as per the requirement
        project_id: selectedProjectId, // Use the selected project ID
      },
    };

    try {
      const result = await signingClient.execute(
        address, // Sender address
        nftContractAddress, // Contract address
        mintMsg, // Execute message
        {
          amount: [{ denom: "ujunox", amount: "7500" }], // fee
          gas: "3000000", // gas limit
        },
        "", // Optional memo
        [{ denom: "ujunox", amount: price }] // Funds sent with transaction
      );
      const projects = await queryProjects();
      const projectsWithId = projects.map((project, index) => ({
        ...project,
        projectId: index + 1,
      }));
      setProjects(projectsWithId);
      getBalances(address).then((result) => {
        setBalances(result);
      }
      );
      setJunoBalance(
        balances?.find((balance) => balance.denom === "ujunox")?.amount /
          1000000 || 0
      );
      setWattpeakBalance(
        balances?.find(
          (balance) =>
            balance.denom ===
            "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka"
        )?.amount / 1000000 || 0
      );
      alert("Minting successful");
    } catch (err) {
      setError(err);
      console.error("Error executing mint:", err);
      alert("Minting failed", err.message);
    } finally {
      setMinting(false);
    }
  };

  if (loading || !config || !junoBalance || !projects || !wattpeakBalance) {
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
    <Container>
      <Box>
        <div className="headerBox">
          <h3>Available Projects to mint</h3>
          <p>
            Price per wattpeak: {config.minting_price.amount}{" "}
            {config.minting_price.denom}
          </p>
        </div>
        <Carousel responsive={responsive} infinite={false} arrows={true}>
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
                <button
                  className={
                    selectedProjectId === project.projectId
                      ? "projectButtonSelected"
                      : "projectButton"
                  }
                  onClick={() => setSelectedProjectId(project.projectId)}
                >
                  {selectedProjectId === project.projectId
                    ? "Selected"
                    : "Select"}
                </button>
              </div>
            </Box>
          ))}
        </Carousel>
      </Box>
      <Box className="mintBox">
        <Box className="inputWrapper" backgroundColor={backgroundColor}>
          <div className="balanceWrapper">
            <span>Juno</span>
            <button onClick={handleMaxClick} className="maxButtonMinting">
              Max
            </button>
            <br />
            <span className="balance">Balance: {junoBalance}</span>
          </div>
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
          <p>
            Minting fee:{" "}
            {parseFloat(
              (cryptoAmount * config.minting_fee_percentage).toFixed(6)
            ).toString()}{" "}
            uJunox
          </p>
          <p>
            You Pay:{" "}
            {parseFloat(
              (
                parseFloat(cryptoAmount) +
                cryptoAmount * config.minting_fee_percentage
              ).toFixed(6)
            ).toString()}{" "}
            uJunox
          </p>

          <p>You receive: {amount} WattPeak </p>
        </Box>
        <button onClick={handleMint} disabled={minting} className="mintBtn">
          {minting ? <Spinner size="sm" color="black" /> : "MINT"}
        </button>
      </Box>
    </Container>
  );
};

export default Minting;
