import React, { ReactNode, SetStateAction, useEffect, useState } from "react";
import { queryStakers } from "../../utils/queryStaker";
import { Box, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "@/utils/balances/junoBalances";
import { useChains } from "@cosmos-kit/react";
import { getStargazeBalances } from "@/utils/balances/stargazeBalances";
import { Flex, Button, Heading, Center } from "@chakra-ui/react";
import Carousel from "react-multi-carousel";
import Modal from "react-modal";
import { queryProjects } from "@/utils/queryProjects";
import Image from "next/image";
import { queryTotalWattpeakStaked } from "@/utils/queryTotalWattpeakStaked";
import { CloseIcon } from "@chakra-ui/icons";
import { Loading } from "./Loading";
import { responsive } from "@/styles/responsiveCarousel";
import { formatDenom } from "@/utils/formatDenoms";
import DonutChart from "./walletStakedWattpeakDonutChart";
import WattpeakPieChart from "./MintedWattpeakChart";
import StakedWattpeakPieChart from "./stakedWattpeakChart";

export const Home = () => {
  const [stakers, setStakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | Error>(null);
  const [balances, setBalances] = useState<{ amount: number; denom: string }[]>(
    []
  );
  const [projects, setProjects] = useState<
    {
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
  const chains = useChains(["stargazetestnet", "junotestnet"]);
  const stargazeAddress = chains.stargazetestnet.address;
  const junoAddress = chains.junotestnet.address;
  const wattPeakDenom = process.env.NEXT_PUBLIC_WATTPEAK_DENOM;

  useEffect(() => {
    const fetchData = async () => {
      if (stargazeAddress && junoAddress) {
        try {
          setLoading(true);

          const projectsResult = await queryProjects();

          const projectsWithId = projectsResult.map(
            (project: any, index: number) => ({
              ...project,
              projectId: index + 1,
            })
          );
          setProjects(projectsWithId);

          const stakersResult = await queryStakers(junoAddress);
          setStakers(stakersResult);
          setStakerStakedWattpeak(stakersResult.wattpeak_staked);

          const balancesResult = await getBalances(junoAddress);
          const stargazeBalances = await getStargazeBalances(stargazeAddress);
          const convertedBalances = [
            ...balancesResult,
            ...stargazeBalances,
          ].map((balance) => ({
            amount: Number(balance.amount),
            denom: balance.denom,
          }));
          setBalances(convertedBalances);

          const stakedWattpeakResults = await queryTotalWattpeakStaked();
          setTotalStakedWattpeak(stakedWattpeakResults); // Ensure this is the correct property

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

          const totalWattpeakResults = projectsWithId.map(
            (project: { max_wattpeak: Number }) => project.max_wattpeak
          );
          const totalWattpeak = totalWattpeakResults.reduce(
            (acc: any, curr: any) => acc + curr,
            0
          );
          setTotalWattpeak(totalWattpeak);
        } catch (err) {
          setError(err as SetStateAction<null | Error>);
          console.error("Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [stargazeAddress, junoAddress, wattPeakDenom]);

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

  const filteredBalances = balances.filter(
    (balance) =>
      balance.denom === wattPeakDenom ||
      balance.denom === "ujunox" ||
      balance.denom === "ustars" ||
      balance.denom ===
        "factory/juno1clr2yca5sphmspex9q6zvrrl7aaes5q8euhljrre89p4tqqslxcqjmks4w/som"
  );

  return (
    <Box color={inputColor} fontFamily="inter">
      <Flex
        gap="40px"
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
              marginBottom="10px"
              color={inputColor}
              fontSize="20px"
              lineHeight="19.36px"
            >
              Portfolio
            </Heading>{" "}
            <Flex
              flexDirection="row"
              width="100%" // Ensure it takes full width of the container
              gap="10px"
              paddingBottom="20px"
              borderRadius="23px"
              backgroundColor={backgroundColor}
              flexWrap="wrap"
              justifyContent="center"
            >
              <Flex flexDirection="column" gap="10px" padding="20px">
                <Heading
                  fontSize="20px"
                  textAlign="center"
                  marginTop="0px"
                  color={inputColor}
                  marginBottom="2px"
                >
                  My Wallet
                </Heading>
                {filteredBalances.map((balance) => (
                  <Box
                    key={balance.denom}
                    fontSize="18px"
                    minWidth="200px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {formatDenom(balance.denom)} :{" "}
                    {parseFloat((balance.amount / 1000000).toFixed(2))}
                  </Box>
                ))}
              </Flex>

              <Box padding="20px">
                <Heading
                  fontSize="20px"
                  textAlign="center"
                  marginTop="0px"
                  color={inputColor}
                >
                  WattPeak Distribution
                </Heading>
                <DonutChart
                  totalMinted={parseFloat(
                    (stakerMintedWattpeak / 1000000).toFixed(2)
                  )}
                  totalStaked={parseFloat(
                    (stakerStakedWattpeak / 1000000).toFixed(2)
                  )}
                />
              </Box>
            </Flex>
          </Flex>
        </Center>
        <Center>
          <Flex height="auto" flexDirection="column" alignItems="center">
            <Heading
              textAlign="left"
              marginBottom="10px"
              color={inputColor}
              fontSize="20px"
              lineHeight="19.36px"
            >
              Tokens Global
            </Heading>{" "}
            <Flex
              flexDirection="row"
              width="100%"
              gap="5px"
              minWidth="200px"
              paddingBottom="20px"
              borderRadius="23px"
              justifyContent="center"
              backgroundColor={backgroundColor}
              flexWrap="wrap"
            >
              <Box mt={10} padding="20px">
                <h3 className="headingsHomePage">Minted Wattpeak</h3>
                <WattpeakPieChart
                  totalMinted={parseFloat(
                    (totalMintedWattpeak / 1000000).toFixed(2)
                  )}
                  totalWattpeak={parseFloat(
                    (totalWattpeak / 1000000).toFixed(2)
                  )}
                />
              </Box>
              <Box mt={10} padding="20px">
                <h3 className="headingsHomePage">Staked WattPeaks</h3>
                <StakedWattpeakPieChart
                  totalStaked={totalStakedWattpeak / 1000000}
                  totalMinted={totalMintedWattpeak / 1000000}
                />
              </Box>
            </Flex>
          </Flex>
        </Center>
      </Flex>
      <Box mt={10} width="90%" margin="auto">
        <Heading
          fontSize="20px"
          textAlign="left"
          paddingLeft="15px"
          color={inputColor}
          marginBottom="5px"
          marginTop="20px"
        >
          Projects
        </Heading>
        <Carousel
          responsive={responsive}
          infinite={false}
          arrows={true}
          containerClass="carousel-container"
        >
          {projects.map((project) => (
            <Box
              key={project.projectId}
              className="project-card"
              backgroundColor={backgroundColor}
            >
              <Image
                src={require("../../images/panel.png")}
                alt={project.name}
              />
              <Box mt={4}>
                <h4>{project.name}</h4>
                <Button
                  onClick={() =>
                    openModal({
                      name: project.name,
                      projectId: project.projectId,
                      minted_wattpeak_count: project.minted_wattpeak_count || 0, // Ensure default value
                      max_wattpeak: project.max_wattpeak || 0, // Ensure default value
                      description:
                        project.description || "No description available.", // Ensure default description
                    })
                  }
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
              marginTop="20px"
              padding="0"
            >
              <Image
                src={require("../../images/panel.png")}
                alt={selectedProject.name}
              />

              <h2>{selectedProject.name}</h2>
              <p>{selectedProject.description}</p>
              <p>
                Max WattPeak:{" "}
                {parseFloat(
                  (selectedProject.max_wattpeak / 1000000).toFixed(2)
                )}
              </p>
              <p>
                Minted WattPeak:{" "}
                {parseFloat(
                  (selectedProject.minted_wattpeak_count / 1000000).toFixed(2)
                )}
              </p>
            </Flex>
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default Home;
