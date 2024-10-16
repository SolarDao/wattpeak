import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { toast } from "react-toastify";

interface HandleMintProps {
  signingClient: SigningCosmWasmClient | null;
  address: string | undefined;
  amount: number;
  selectedProjectId: number | null;
  price: string;
  nftContractAddress: string;
  queryProjects: () => Promise<any[]>;
  getBalances: (address: string) => Promise<any[]>;
  setProjects: (projects: any[]) => void;
  setBalances: (balances: any[]) => void;
  setJunoBalance: (balance: number) => void;
  setWattpeakBalance: (balance: number) => void;
  setError: (error: any) => void;
  setMinting: (minting: boolean) => void;
  balances: any[];
}

export const handleMint = async ({
  signingClient,
  address,
  amount,
  selectedProjectId,
  price,
  nftContractAddress,
  queryProjects,
  getBalances,
  setProjects,
  setBalances,
  setJunoBalance,
  setWattpeakBalance,
  setError,
  setMinting,
  balances,
}: HandleMintProps) => {
  if (!signingClient) {
    console.error("Signing client not initialized");
    return;
  }
  if (!selectedProjectId) {
    toast.warn("Please select a project to mint.");
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
      address as string, // Sender address
      nftContractAddress, // Contract address
      mintMsg, // Execute message
      {
        amount: [{ denom: "ujunox", amount: "7500" }], // fee
        gas: "3000000", // gas limit
      },
      "", // Optional memo
      [{ denom: "ujunox", amount: (Number(price).toFixed(0)).toString() }] // Funds sent with transaction
    );
    const projects = await queryProjects();
    const projectsWithId = projects.map((project, index) => ({
      ...project,
      projectId: index + 1,
    }));
    setProjects(projectsWithId);
    getBalances(address || "").then((result) => {
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
          process.env.NEXT_PUBLIC_WATTPEAK_DENOM
      )?.amount / 1000000 || 0
    );
    toast.success("Minting successful");
  } catch (err) {
    setError(err);
    toast.error("Minting failed: " + (err as any).message);
    console.error("Error executing mint:", err);
  } finally {
    setMinting(false);
  }
};
