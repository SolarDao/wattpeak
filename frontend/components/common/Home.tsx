import React, { ReactNode, useEffect, useState } from "react";
import { queryStakers } from "../../utils/queries/queryStaker";
import { Box, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "@/utils/balances/junoBalances";
import { getStargazeBalances } from "@/utils/balances/stargazeBalances";
import { Flex, Button, Heading, Center } from "@chakra-ui/react";
import Carousel from "react-multi-carousel";
import Modal from "react-modal";
import { queryProjects } from "@/utils/queries/queryProjects";
import Image from "next/image";
import { queryTotalWattpeakStaked } from "@/utils/queries/queryTotalWattpeakStaked";
import { CloseIcon } from "@chakra-ui/icons";
import { Loading } from "./helpers/Loading";
import { responsive } from "@/styles/responsiveCarousel";
import { formatDenom } from "@/utils/balances/formatDenoms";
import DonutChart from "./charts/walletStakedWattpeakDonutChart";
import WattpeakPieChart from "./charts/MintedWattpeakChart";
import StakedWattpeakPieChart from "./charts/stakedWattpeakChart";
import { useChain } from "@cosmos-kit/react";
import { WalletStatus } from "@cosmos-kit/core";
import { formatBalance } from "../../utils/balances/formatBalances";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

interface HomeProps {
  initialLoading: boolean;
  walletStatus: WalletStatus;
  walletAddress: string | undefined;
  currentSection: string; // Add this
}

export const Home = ({ walletStatus, currentSection }: HomeProps) => {
  const [stakers, setStakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | Error>(null);
  const [balances, setBalances] = useState<{ amount: number; denom: string }[]>(
    []
  );
  const [projects, setProjects] = useState<
    {
      location: any;
      description: string;
      max_wattpeak: number;
      minted_wattpeak_count: number;
      name: string;
      projectId: number;
    }[]
  >([]);
  const [selectedProject, setSelectedProject] = useState<null | {
    minted_wattpeak_count: number;
    max_wattpeak: number;
    description: ReactNode;
    name: string;
    projectId: number;
  }>(null);
  const [totalMintedWattpeak, setTotalMintedWattpeak] = useState(0);
  const [totalStakedWattpeak, setTotalStakedWattpeak] = useState(0);
  const [stakerMintedWattpeak, setStakerMintedWattpeak] = useState(0);
  const [stakerStakedWattpeak, setStakerStakedWattpeak] = useState(0);
  const [totalWattpeak, setTotalWattpeak] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const inputColor = useColorModeValue("#000000B2", "white");
  const borderColor = useColorModeValue("black", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );
  const modalBackgroundColor = useColorModeValue(
    "white",
    "rgba(35, 35, 35, 1)"
  );
  const backgroundColorProjects = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(48, 50, 54, 1)"
  );

  const mapStyles = {
    height: "400px",
    width: "98%",
    marginBottom: "10px",
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: "23px",
    border: "2px solid #ccc",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)",
  };

  const defaultCenter = {
    lat: 30.7128,
    lng: 13.006,
  };

  const stargazeChain = useChain("stargazetestnet");
  const junoChain = useChain("junotestnet");

  const stargazeAddress = stargazeChain.address;
  const junoAddress = junoChain.address;

  const wattPeakDenom = process.env.NEXT_PUBLIC_WATTPEAK_DENOM;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (
          walletStatus === WalletStatus.Connected &&
          stargazeAddress &&
          junoAddress
        ) {
          // Initiate all fetch operations in parallel
          const [
            projectsResult,
            stakersResult,
            balancesResult,
            stargazeBalances,
            stakedWattpeakResults,
          ] = await Promise.all([
            queryProjects(),
            queryStakers(junoAddress),
            getBalances(junoAddress),
            getStargazeBalances(stargazeAddress),
            queryTotalWattpeakStaked(),
          ]);

          // Process the fetched data
          const projectsWithId = projectsResult.map(
            (project: any, index: number) => ({
              ...project,
              projectId: index + 1,
            })
          );
          setProjects(projectsWithId);

          setStakers(stakersResult);
          setStakerStakedWattpeak(stakersResult.wattpeak_staked);

          const convertedBalances = [
            ...balancesResult,
            ...stargazeBalances,
          ].map((balance) => ({
            amount: Number(balance.amount),
            denom: balance.denom,
          }));
          setBalances(convertedBalances);

          setTotalStakedWattpeak(stakedWattpeakResults);

          const wattpeakBalance = balancesResult.find(
            (balance) => balance.denom === wattPeakDenom
          );
          if (wattpeakBalance) {
            setStakerMintedWattpeak(Number(wattpeakBalance.amount));
          }

          const totalMinted = projectsWithId.reduce(
            (acc: number, project: { minted_wattpeak_count: number }) =>
              acc + project.minted_wattpeak_count,
            0
          );
          setTotalMintedWattpeak(totalMinted);

          const totalWattpeak = projectsWithId.reduce(
            (acc: number, project: { max_wattpeak: number }) =>
              acc + project.max_wattpeak,
            0
          );
          setTotalWattpeak(totalWattpeak);

          const res = await fetch("/api/getGoogleMapsApiKey");
          const data = await res.json();
          setApiKey(data.apiKey);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        // Stop loading once data is fetched
        setLoading(false);
      }
    };

    if (
      walletStatus === WalletStatus.Connected &&
      stargazeAddress &&
      junoAddress
    ) {
      fetchData();
    }
  }, [
    stargazeAddress,
    junoAddress,
    walletStatus,
    currentSection,
    wattPeakDenom,
  ]);

  const openModal = (
    project: {
      minted_wattpeak_count: number;
      max_wattpeak: number;
      description: ReactNode;
      name: string;
      projectId: number;
    } | null
  ) => {
    if (project) {
      setSelectedProject({
        minted_wattpeak_count: project.minted_wattpeak_count,
        max_wattpeak: project.max_wattpeak,
        description: project.description,
        name: project.name,
        projectId: project.projectId,
      });
      setModalIsOpen(true);
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedProject(null);
  };

  if (loading) {
    return <Loading />;
  }

  const filteredBalances = balances
    .filter(
      (balance) =>
        balance.denom === wattPeakDenom ||
        balance.denom === "ujunox" ||
        balance.denom === "ustars" ||
        balance.denom ===
          "solar"
    )
    .map((balance) => ({
      ...balance,
      formattedAmount: formatBalance(balance.amount),
    }));

  return (
    <Box color={inputColor}>
      <Flex
        gap="75px"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
      >
        <Center>
          <Flex
            height="auto"
            flexDirection="column" // Change to column to stack the heading and content
            alignItems="center" // Center the content horizontally
          >
            <Heading
              display={"flex"}
              gap={"5px"}
              textAlign="left"
              marginBottom="10px"
              marginLeft="15px"
              color={inputColor}
              fontSize="22px"
              lineHeight="19.36px"
            >
              <Box>Portfolio</Box>
              <Image
                src={require("../../images/crypto-wallet.png")}
                width={22}
                alt={"Hallo"}
              />
            </Heading>{" "}
            <Flex
              flexDirection="row"
              width="100%" // Ensure it takes full width of the container
              gap="10px"
              borderRadius="23px"
              backgroundColor={backgroundColor}
              flexWrap="wrap"
              justifyContent="center"
              boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
            >
              <Flex flexDirection="column" gap="25px" padding="20px">
                <Heading
                  fontSize="20px"
                  textAlign="center"
                  marginTop="0px"
                  color={inputColor}
                  marginBottom="0"
                  marginLeft="7px"
                >
                  Balances
                </Heading>
                {filteredBalances.length === 0 ? (
                  <Center height="200px" width="200px">
                    No balances in Wallet
                  </Center>
                ) : (
                  filteredBalances.map((balance) => (
                    <Box
                      key={balance.denom}
                      fontSize="18px"
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      minWidth="180px"
                      paddingLeft="15px"
                    >
                      <Box fontWeight="semibold">
                        {formatDenom(balance.denom)}
                      </Box>
                      <Box fontWeight="bold">{balance.formattedAmount}</Box>
                    </Box>
                  ))
                )}
              </Flex>

              <Box padding="20px">
                <Heading
                  fontSize="20px"
                  textAlign="center"
                  marginTop="0px"
                  color={inputColor}
                >
                  Staked WattPeak
                </Heading>
                {stakerMintedWattpeak === 0 && stakerStakedWattpeak === 0 ? (
                  <Center height="200px" width="200px">
                    No WattPeak in Wallet
                  </Center>
                ) : (
                  <DonutChart
                    totalMinted={parseFloat(
                      (stakerMintedWattpeak / 1000000).toFixed(2)
                    )}
                    totalStaked={parseFloat(
                      (stakerStakedWattpeak / 1000000).toFixed(2)
                    )}
                    inputColor={inputColor}
                  />
                )}
              </Box>
            </Flex>
          </Flex>
        </Center>
        <Center>
          <Flex height="auto" flexDirection="column" alignItems="center" >
            <Heading
              display={"flex"}
              gap={"5px"}
              textAlign="left"
              marginBottom="10px"
              color={inputColor}
              fontSize="22px"
              lineHeight="19.36px"
            >
              <Box>Tokens Global</Box>
              <Image
                src={require("../../images/pngegg.png")}
                width={22}
                alt={"Hallo"}
              />
            </Heading>{" "}
            <Flex
              flexDirection="row"
              width="100%"
              gap="5px"
              minWidth="200px"
              borderRadius="23px"
              justifyContent="center"
              backgroundColor={backgroundColor}
              flexWrap="wrap"
              boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
            >
              <Box mt={10} padding="20px">
                <Heading
                  fontSize="20px"
                  textAlign="center"
                  marginTop="0px"
                  color={inputColor}
                >
                  Minted Wattpeak
                </Heading>
                <WattpeakPieChart
                  totalMinted={parseFloat(
                    (totalMintedWattpeak / 1000000).toFixed(2)
                  )}
                  totalWattpeak={parseFloat(
                    (totalWattpeak / 1000000).toFixed(2)
                  )}
                  inputColor={inputColor}
                />
              </Box>
              <Box mt={10} padding="20px">
                <Heading
                  fontSize="20px"
                  textAlign="center"
                  marginTop="0px"
                  color={inputColor}
                >
                  Staked WattPeak
                </Heading>
                <StakedWattpeakPieChart
                  totalStaked={totalStakedWattpeak / 1000000}
                  totalMinted={totalMintedWattpeak / 1000000}
                  inputColor={inputColor}
                />
              </Box>
            </Flex>
          </Flex>
        </Center>
      </Flex>
      <Box mt={10} width="90%" margin="auto" > 
        <Heading
          display={"flex"}
          gap={"5px"}
          justifyContent="center"
          marginBottom="10px"
          marginTop="30px"
          marginLeft="15px"
          color={inputColor}
          fontSize="22px"
          lineHeight="19.36px"
        >
          <Box>Solar Parks</Box>
          <Image
            src={require("../../images/solar-panel.png")}
            width={24}
            alt={"Hallo"}
          />
        </Heading>{" "}
        <Box
          backgroundColor={backgroundColor}
          borderRadius="23px"
          padding="10px"
          paddingBottom="18px"
          paddingTop="18px"
          marginBottom="5%"
          boxShadow="0px 4px 6px rgba(0, 0, 0, 0.5)"
        >
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={mapStyles}
              zoom={2}
              center={defaultCenter}
            >
              {projects.map((project, index) => (
                <Marker
                  key={index}
                  position={{
                    lat: Number(project.location.latitude),
                    lng: Number(project.location.longitude),
                  }}
                  title={project.name} 
                  onClick={() => {
                    openModal({
                      name: project.name,
                      projectId: project.projectId,
                      minted_wattpeak_count: project.minted_wattpeak_count || 0,
                      max_wattpeak: project.max_wattpeak || 0,
                      description:
                        project.description || "No description available.",
                    });
                  }}
                />
              ))}
            </GoogleMap>
          </LoadScript>
          <Carousel
            responsive={responsive}
            infinite={false}
            arrows={true}
            containerClass="carousel-container"
          >
            {projects.map((project) => (
              <Box
                key={project.projectId}
                backgroundColor={backgroundColorProjects}
                boxShadow="0px 1px 2px rgba(0, 0, 0, 0.5)"
                marginBottom="20px"
                className="project-card-home"
              >
                <Image
                  src={require("../../images/panel.png")}
                  alt={project.name}
                />
                <Box
                  mt={4}
                  display="flex"
                  justifyContent="center"
                  flexDirection="column"
                  alignItems="center"
                >
                  <h4>{project.name}</h4>
                  <Button
                    onClick={() =>
                      openModal({
                        name: project.name,
                        projectId: project.projectId,
                        minted_wattpeak_count:
                          project.minted_wattpeak_count || 0,
                        max_wattpeak: project.max_wattpeak || 0,
                        description:
                          project.description || "No description available.",
                      })
                    }
                    width="130px"
                    className="projectButton"
                    color={inputColor}
                    borderColor={borderColor}
                    _hover={{
                      background:
                        "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
                      color: "black",
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>
            ))}
          </Carousel>
        </Box>
      </Box>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Project Details"
        ariaHideApp={false}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "10px",
            maxWidth: "250px",
            maxHeight: "600px",
            width: "100%",
            color: inputColor,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: modalBackgroundColor,
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          },
        }}
      >
        {selectedProject && (
          <Box>
            <Button
              onClick={() => setModalIsOpen(false)}
              style={{
                position: "absolute",
                right: "20px",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <CloseIcon color={inputColor} position="absolute" right="-2px" />
            </Button>
            <Flex
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap="20px"
              marginTop="10px"
              padding="0"
            >
              <Image
                src={require("../../images/panel.png")}
                alt={selectedProject.name}
              />
              <Heading
                marginTop="5px"
                marginBottom="0px"
                textAlign="center"
                fontSize="20px"
              >
                {selectedProject.name}
              </Heading>
              <Box textAlign="center">{selectedProject.description}</Box>
              <Box>
                Max WattPeak:{" "}
                {parseFloat(
                  (selectedProject.max_wattpeak / 1000000).toFixed(2)
                )}
              </Box>
              <Box>
                Minted WattPeak:{" "}
                {parseFloat(
                  (selectedProject.minted_wattpeak_count / 1000000).toFixed(2)
                )}
              </Box>
            </Flex>
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default Home;
