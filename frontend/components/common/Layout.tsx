import { Box, Container } from '@interchain-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Minting } from './Minting';
import { Staking } from './Staking';
import { Swap } from './Swap';
import { Projects } from './Projects';
import { Faq } from './Faq';
import { SetStateAction, useState, useEffect } from 'react';
import { SideNavbar } from './SideNavbar';
import { Settings } from './Settings';
import { Analytics } from './Analytics';
import { Home } from './Home';
import { CHAIN_NAME_STORAGE_KEY } from "@/config";
import { useWallet } from '@cosmos-kit/react';

const JUNO_CHAIN_NAME = 'junotestnet';
const STARGAZE_CHAIN_NAME = 'stargazetestnet';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState('home');
  const [chainName, setChainName] = useState(JUNO_CHAIN_NAME);
  const walletName = "keplr-extension";


  const handleSectionChange = (section: SetStateAction<string>) => {
    setCurrentSection(section);
    const newChainName = section === 'swapping' ? STARGAZE_CHAIN_NAME : JUNO_CHAIN_NAME;
    setChainName(newChainName);
    localStorage.setItem(CHAIN_NAME_STORAGE_KEY, newChainName);
  };

  useEffect(() => {
    const storedChainName = localStorage.getItem(CHAIN_NAME_STORAGE_KEY);
    if (storedChainName) {
      setChainName(storedChainName);
    }
  }, []);

  const renderSection = () => {
    switch (currentSection) {
      case 'home':
        return <Home />;
      case 'minting':
        return <Minting chainName={chainName} />
      case 'staking':
        return <Staking />;
      case 'swapping':
        return <Swap />;
      case 'projects':
        return <Projects />;
      case 'faq':
        return <Faq />;
      case 'settings':
        return <Settings />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Home />;
    }
  };

  return (
    <Container maxWidth="80rem" attributes={{ py: '$14' }}>
      <div className="box">
        <Header setCurrentSection={handleSectionChange} chainName={chainName} />
        <Box display="flex">
          <SideNavbar setCurrentSection={handleSectionChange} />
          <Box flex="1" p="$4" minHeight="$fit" backgroundColor="White" borderRadius="$4xl" color="Black" marginRight="$10">
            {renderSection()}
            {children}
          </Box>
        </Box>
        <Footer />
      </div>
    </Container>
  );
};
