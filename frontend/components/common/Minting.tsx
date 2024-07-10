import React, { useEffect, useState } from "react";
import { useChainWallet, useWallet } from "@cosmos-kit/react";
import { getCosmWasmClient } from "../../utils/junoSetup";
import { Box, Spinner } from "@interchain-ui/react";
import { getBalances } from "@/utils/junoBalances";
import Slider from "react-slick";
import { queryProjects } from "../../utils/queryProjects";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { setConfig } from "next/config";

const nftContractAddress =
  process.env.NEXT_PUBLIC_WATTPEAK_MINTER_CONTRACT_ADDRESS;

export async function queryNftConfig() {
  const client = await getCosmWasmClient();
  const queryMsg = { config: {} };
  const queryResult = await client.queryContractSmart(
    nftContractAddress,
    queryMsg
  );
  console.log("Query Result:", queryResult);
  setConfig(queryResult);
  return queryResult;
}

export const Minting = ({ chainName }) => {
  let wallet = useWallet();
  let walletName = wallet?.wallet?.name ?? "";

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
    const newAmount = parseFloat(e.target.value);
    setAmount(newAmount);
    setCryptoAmount((newAmount * config.minting_price.amount).toFixed(6));
  };

  const handleCryptoAmountChange = (e) => {
    const newCryptoAmount = parseFloat(e.target.value);
    setCryptoAmount(newCryptoAmount);
    setAmount((newCryptoAmount / config.minting_price.amount).toFixed(6));
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
        console.log(projectsWithId);

        console.log("Projects:", projectsWithId); // Log the projects to verify data
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  let settings = {
    dots: true,
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

  console.log(
    status,
    address,
    walletName,
    chainName,
    wallet,
    getSigningCosmWasmClient,
    connect
  );

  useEffect(() => {
    const fetchConfig = async () => {
      if (status === "Connected") {
        try {
          const client = await getSigningCosmWasmClient();
          console.log("Client:", client);

          setSigningClient(client);

          queryNftConfig().then((result) => {
            setConfig(result);
            console.log(result);
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
    console.log("Payable amount:", payable_amount);
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
      getBalances(address).then((result) => {
        setBalances(result);
        console.log("Balances:", result);
      });
      const projects = await queryProjects();
      const projectsWithId = projects.map((project, index) => ({
        ...project,
        projectId: index + 1,
      }));
      setProjects(projectsWithId);
      console.log("Minting result:", result);
      alert("Minting successful");
    } catch (err) {
      setError(err);
      console.error("Error executing mint:", err);
    } finally {
      setMinting(false);
    }
  };
  return (
    <div>
      <h1> Wattpeak Minter </h1>
      {error && <p>Error: {error.message}</p>}
      <div>
        <h3>Available Projects to mint</h3>
        <Slider {...settings}>
          {projects.map((project) => (
            <div key={project.projectId} className="project-card">
              <Image src={require("../../images/panel.png")} alt={"Hallo"} />
              <div className="project-details">
                <p>{project.name}</p>
                <p>
                  Available WattPeak:{" "}
                  {(project.max_wattpeak - project.minted_wattpeak_count) /
                    1000000}
                </p>
                <button
                  onClick={() => setSelectedProjectId(project.projectId)}
                  style={{
                    backgroundColor:
                      selectedProjectId === project.projectId
                        ? "lightgreen"
                        : "",
                  }}
                >
                  {selectedProjectId === project.projectId
                    ? "Selected"
                    : "Select"}
                </button>
              </div>
            </div>
          ))}
        </Slider>
      </div>
      {config ? (
        <pre>
          Price per Wattpeak: {config.minting_price.amount}
          {config.minting_price.denom}
        </pre>
      ) : (
        <p>Loading config...</p>
      )}
      <div className="mintBox">
        <div className="inputWrapper">
          <span>Wattpeak</span>
          <span>Balance: {}</span>
          <input
            type="number"
            value={amount}
            className="mintWattpeakInput"
            onChange={handleAmountChange}
            min="1"
            placeholder="Amount to mint"
          />
        </div>
        <div className="inputWrapper">
          <span>Wattpeak</span>
          <span>Balance: {}</span>
          <input
            type="number"
            value={cryptoAmount}
            className="mintJunoInput"
            onChange={handleCryptoAmountChange}
            placeholder="Crypto amount"
          />
        </div>
        <div className="priceDetailsS">
          <p>You Pay: {price} ujunox</p>
          <p>You receive: {amount} WattPeak </p>
          <p>Minting fee: {price * 0.05}</p>
        </div>
        <button onClick={handleMint} disabled={minting} className="mintBtn">
          {minting ? <Spinner size="sm" color="black" /> : "Mint"}
        </button>
      </div>

      {(loading || minting) && (
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
          <Spinner size="lg" color="black" />
        </Box>
      )}
    </div>
  );
};

export default Minting;
