import React, { useEffect, useState } from "react";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
import { getCosmWasmClient } from "../../utils/junoSetup";
import { Box, Button, Container, Spinner, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "@/utils/junoBalances";
import Slider from "react-slick";
import { queryProjects } from "../../utils/queryProjects";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { setConfig } from "next/config";
import { Input } from "@chakra-ui/react";

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
  const backgroundColor = useColorModeValue("rgba(0, 0, 0, 0.04)", "rgba(52, 52, 52, 1)");

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
  const [error, setError] = useState(null);
  const [cryptoAmount, setCryptoAmount] = useState("");

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

  let settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: false,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  useEffect(() => {
    const fetchConfig = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();

          setSigningClient(client);

          queryNftConfig().then((result) => {
            setConfig(result);
            setCryptoAmount(result.minting_price.amount);
          });
          getBalances(address).then((result) => {
            setBalances(result);
          });
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
  }, [status, getSigningCosmWasmClient, connect]);

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
      alert("Minting successful");
    } catch (err) {
      setError(err);
      console.error("Error executing mint:", err);
      alert("Minting failed", err.message);
    } finally {
      setMinting(false);
    }
  };

  const junoBalance =
    balances?.find((balance) => balance.denom === "ujunox")?.amount / 1000000 ||
    0;
  const wattpeakBalance =
    balances?.find(
      (balance) =>
        balance.denom ===
        "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka"
    )?.amount / 1000000 || 0;

  if (loading || !config) {
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
        <Slider {...settings}>
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
                <button onClick={() => setSelectedProjectId(project.projectId)}>
                  {selectedProjectId === project.projectId
                    ? "Selected"
                    : "Select"}
                </button>
              </div>
            </Box>
          ))}
        </Slider>
      </Box>
      <Box className="mintBox">
        <Box className="inputWrapper"
        backgroundColor={backgroundColor}
        >
          <div className="balanceWrapper">
            <span>Juno</span> <br />
            <span>Balance: {junoBalance}</span>
            <button onClick={handleMaxClick} className="maxButtonMinting">
              Max
            </button>
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
        <Box className="inputWrapper"
        backgroundColor={backgroundColor}
        >
          <div className="balanceWrapper">
            <span>Wattpeak</span> <br />
            <span>Balance: {wattpeakBalance}</span>
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
        <Box className="priceDetails"
        backgroundColor={backgroundColor}
        >
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
        <Button onClick={handleMint} disabled={minting} className="mintBtn">
          {minting ? <Spinner size="sm" color="black" /> : "Mint"}
        </Button>
      </Box>
    </Container>
  );
};

export default Minting;
