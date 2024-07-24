import React, { SetStateAction, useEffect, useState } from "react";
import { queryStakers } from "../../utils/queryStaker";
import { Spinner, Box, useColorModeValue } from "@interchain-ui/react";
import { getBalances } from "@/utils/balances/junoBalances";
import { useChains } from "@cosmos-kit/react";
import { getStargazeBalances } from "@/utils/balances/stargazeBalances";
import { Flex, Button } from "@chakra-ui/react";
import Carousel from "react-multi-carousel";
import Modal from "react-modal";
import { queryProjects } from "@/utils/queryProjects";
import Image from "next/image";
import { queryTotalWattpeakStaked } from "@/utils/queryTotalWattpeakStaked";
import { CloseIcon } from "@chakra-ui/icons";
import { Loading } from "./Loading";

const formatDenom = (denom: string) => {
  let formattedDenom = denom;

  if (denom.startsWith("factory")) {
    formattedDenom = denom.split("/").pop() as string;
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
  const [stakers, setStakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balances, setBalances] = useState<{ amount: number; denom: string }[]>(
    []
  );
  const [projects, setProjects] = useState<
    {
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
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const inputColor = useColorModeValue("black", "white");
  const borderColor = useColorModeValue("black", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );
  const chains = useChains(["stargazetestnet", "junotestnet"]);
  const stargazeAddress = chains.stargazetestnet.address;
  const junoAddress = chains.junotestnet.address;

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

          const balancesResult = await getBalances(junoAddress);
          const stargazeBalances = await getStargazeBalances(stargazeAddress);
          setBalances([...balancesResult, ...stargazeBalances]);

          const stakedWattpeakResults = await queryTotalWattpeakStaked();
          setTotalStakedWattpeak(stakedWattpeakResults);

          const totalMinted = projectsWithId.reduce(
            (acc: number, project: { minted_wattpeak_count: number }) =>
              acc + project.minted_wattpeak_count,
            0
          );
          setTotalMintedWattpeak(totalMinted);
        } catch (err) {
          setError(err as SetStateAction<null>);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [stargazeAddress, junoAddress]);

  const openModal = (
    project: React.SetStateAction<null | { name: string; projectId: number }>
  ) => {
    setSelectedProject(project);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedProject(null);
  };

  if (loading) {
    return (
        <Loading />
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
            width: "100%",
            color: "black",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
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
              <CloseIcon color={inputColor} />
            </Button>
            <Image
              src={require("../../images/panel.png")}
              alt={selectedProject.name}
            />
            <h2>{selectedProject.name}</h2>
            <p>{selectedProject.description}</p>
            <p>Max WattPeak: {selectedProject.max_wattpeak / 1000000}</p>
            <p>
              Minted WattPeak: {selectedProject.minted_wattpeak_count / 1000000}
            </p>
          </Box>
        )}
      </Modal>
    </div>
  );
};

export default Home;
