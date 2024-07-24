import React, { useEffect, useState } from "react";
import { useWalletAddress } from "../../context/WalletAddressContext";
import { queryStakers } from "../../utils/queryStaker";
import { Spinner, Box, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "@/utils/junoBalances";
import { useChains } from "@cosmos-kit/react";
import { getStargazeBalances } from "@/utils/stargazeBalances";
import { Flex, Button } from "@chakra-ui/react";
import Carousel from "react-multi-carousel";
import Modal from "react-modal";
import { queryProjects } from "@/utils/queryProjects";
import Image from "next/image";
import { queryTotalWattpeakStaked } from "@/utils/queryTotalWattpeakStaked";

const formatDenom = (denom) => {
  let formattedDenom = denom;

  if (denom.startsWith("factory")) {
    formattedDenom = denom.split("/").pop();
  }

  if (formattedDenom.startsWith("u")) {
    formattedDenom = formattedDenom.slice(1);
  }

  if (formattedDenom === "stars" || formattedDenom === "junox") {
    formattedDenom = formattedDenom.toUpperCase();
  }

  if (formattedDenom === "wattpeaka") {
    formattedDenom = "WattPeak";
  }

  if (formattedDenom === "som") {
    formattedDenom = "SoM";
  }
  return formattedDenom;
};

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

export const Home = () => {
  const [staker, setStakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { walletAddress } = useWalletAddress();
  const [balances, setBalances] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [totalMintedWattpeak, setTotalMintedWattpeak] = useState(0);
  const [totalStakedWattpeak, setTotalStakedWattpeak] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const inputColor = useColorModeValue("black", "white");
  const borderColor = useColorModeValue("black", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );
  const chains = useChains(["stargazetestnet", "junotestnet"]);

  useEffect(() => {
    const fetchStakers = async () => {
      if (walletAddress) {
        setLoading(true);
        try {
          const stakersResult = await queryStakers(walletAddress);
          setStakers(stakersResult);

          const balancesResult = await getBalances(walletAddress);
          const stargazeBalances = await getStargazeBalances(
            chains.stargazetestnet.address
          );
          setBalances([...balancesResult, ...stargazeBalances]);

          const totalStakedWattpeak = await queryTotalWattpeakStaked();
          setTotalStakedWattpeak(totalStakedWattpeak);
          console.log(totalStakedWattpeak);
          
          const result = await queryProjects();
          const projectsWithId = result.map((project, index) => ({
            ...project,
            projectId: index + 1,
          }));
          setProjects(projectsWithId);
          console.log(projects);

          setTotalMintedWattpeak(projectsWithId.reduce(
            (acc, project) => acc + (project.minted_wattpeak_count / 1000000).toFixed(2),
            0
          ));
          console.log(totalMintedWattpeak);
          
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStakers();
  }, [walletAddress, totalMintedWattpeak, totalStakedWattpeak, projects]);

  const openModal = (project) => {
    setSelectedProject(project);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedProject(null);
  };

  if (loading || projects.length === 0 || !balances) {
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

  const filteredBalances = balances.filter(
    (balance) =>
      balance.denom ===
        "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka" ||
      balance.denom === "ujunox" ||
      balance.denom === "ustars" ||
      balance.denom ===
        "factory/juno1clr2yca5sphmspex9q6zvrrl7aaes5q8euhljrre89p4tqqslxcqjmks4w/som"
  );

  return (
    <div>
      <Flex
        borderRadius="23px"
        backgroundColor={backgroundColor}
        width="20%"
        padding="20px"
        flexDirection="column"
        gap="5px"
      >
        <h3>My Wallet</h3>
        {filteredBalances.map((balance) => (
          <div key={balance.denom}>
            {formatDenom(balance.denom)} :{" "}
            {parseFloat((balance.amount / 1000000).toFixed(2))}
          </div>
        ))}
      </Flex>
      <Box mt={10}>
        <h3>Projects</h3>
        <Carousel responsive={responsive} infinite={false} arrows={true}>
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
                  onClick={() => openModal(project)}
                  className="projectButton"
                  color={inputColor}
                  borderColor={borderColor}
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
            padding: "20px",
            maxWidth: "500px",
            width: "100%",
            color: "black",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          },
        }}
      >
        {selectedProject && (
          <Box>
            <Image src={require("../../images/panel.png")} alt={selectedProject.name} />
            <h2>{selectedProject.name}</h2>
            <p>{selectedProject.description}</p>
            <p>Max WattPeak: {selectedProject.max_wattpeak / 1000000}</p>
            <p>
              Minted WattPeak: {selectedProject.minted_wattpeak_count / 1000000}
            </p>

            <Button onClick={closeModal} colorScheme="blue" mt={4}>
              Close
            </Button>
          </Box>
        )}
      </Modal>
    </div>
  );
};

export default Home;
