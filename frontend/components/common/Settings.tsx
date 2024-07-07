import { useWalletAddress } from '../../context/WalletAddressContext';

export const Settings = () => {

    const { walletAddress } = useWalletAddress(); // Use the context
    return <div>{walletAddress}</div>;
      
  };