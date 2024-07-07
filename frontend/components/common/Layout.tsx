import Head from 'next/head';
import { Box, Container } from '@interchain-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Minting } from './Minting';
import { Staking } from './Staking';
import { Swap } from './Swap';
import { Projects } from './Projects';
import { Faq } from './Faq';
import { useState } from 'react';
import { CHAIN_NAME, CHAIN_NAME_STORAGE_KEY } from "@/config";
import { SideNavbar } from './SideNavbar';
import { Settings } from './Settings';
import { Analytics } from './Analytics';
import { Home } from './Home';

export const Layout: React.FC = ({ children }) => {
  const [currentSection, setCurrentSection] = useState('home');
  const [chainName, setChainName] = useState(CHAIN_NAME);

  const renderSection = () => {
    switch (currentSection) {
      case 'home':
        return <Home />;
      case 'minting':
        return <Minting />;
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
        return <Minting />;
    }
  };

  function handleChainChange(chainName?: string) {
    if (chainName) {
      setChainName(chainName);
      localStorage.setItem(CHAIN_NAME_STORAGE_KEY, chainName!);
    }
  }

  return (
    <Container maxWidth="80rem" attributes={{ py: '$14' }}>
      <div className="box">
      <Header setCurrentSection={setCurrentSection} />
      <Box display="flex">
        <SideNavbar setCurrentSection={setCurrentSection} />
        <Box flex="1" p="$4" minHeight= "$fit" backgroundColor="White" borderRadius="$4xl" color="Black" marginRight="$10">
          {renderSection()}
          {children}
        </Box>
      </Box>
      <Footer chainName={chainName} handleChainChange={handleChainChange} />
      </div>
    </Container>
  );
};