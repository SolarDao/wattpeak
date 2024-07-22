import { Box, Container, useColorModeValue } from '@interchain-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Minting } from './Minting';
import { Staking } from './Staking';
import { Swap } from './Swap';
import { Faq } from './Faq';
import { SetStateAction, useState, useEffect } from 'react';
import { SideNavbar } from './SideNavbar';
import { Analytics } from './Analytics';
import { Home } from './Home';
import { CHAIN_NAME_STORAGE_KEY } from "@/config";

const JUNO_CHAIN_NAME = 'junotestnet';
const STARGAZE_CHAIN_NAME = 'stargazetestnet';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState('home');
  const [chainName, setChainName] = useState(JUNO_CHAIN_NAME);

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
        return <Home junoChain={JUNO_CHAIN_NAME} stargazeChain={STARGAZE_CHAIN_NAME} />;
      case 'minting':
        return <Minting chainName={chainName} />;
      case 'staking':
        return <Staking chainName={chainName} />;
      case 'swapping':
        return <Swap chainName={chainName} />;
      case 'faq':
        return <Faq />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Home junoChain={JUNO_CHAIN_NAME} stargazeChain={STARGAZE_CHAIN_NAME} />;
    }
  };

  return (
    <Container maxWidth="80rem" attributes={{ py: '$14' }}>
      <Box className='box' 
      backgroundImage={useColorModeValue('linear-gradient(116.82deg, #855d15 0%, #141406 99.99%, #070D1C 100%)', '')}
      backgroundColor={useColorModeValue('', 'rgba(52, 52, 52, 1)')}
      >
        <Header setCurrentSection={handleSectionChange} chainName={chainName} />
        <Box display="flex" className='whiteBox'
        >
          <SideNavbar setCurrentSection={handleSectionChange} />
          <Box flex="1" p="$4" minHeight="$fit" borderRadius="$4xl" color="Black" marginRight="$10" maxWidth="93%"
                  attributes={
                    {
                      backgroundColor: useColorModeValue("$white", "rgba(35, 35, 35, 1)"),
                      color: useColorModeValue("$black", "$white"),
                    }
                  } >
            {renderSection()}
            {children}
          </Box>
        </Box>
        <Footer />
      </Box>
    </Container>
  );
};
