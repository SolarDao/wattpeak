import '../styles/globals.css';
import '@interchain-ui/react/styles';
import type { AppProps } from 'next/app';
import { SignerOptions, wallets } from 'cosmos-kit';
import { ChainProvider } from '@cosmos-kit/react';
import { assets, chains } from 'chain-registry';
import { Box, ThemeProvider, useColorModeValue, useTheme } from '@interchain-ui/react';
import { WalletAddressProvider } from '../context/WalletAddressContext';  // Import the WalletAddressProvider
import { BalancesProvider } from '@/context/junoBalancesContext';

console.log('chains', chains);

// Include only the required chains
const includedChains = chains.filter(chain => ['stargazetestnet', 'junotestnet'].includes(chain.chain_name));

console.log('wallets', wallets);


function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const { themeClass } = useTheme();

  const signerOptions: SignerOptions = {
    // signingStargate: () => {
    //   return getSigningCosmosClientOptions();
    // }
  };
  
  return (
    <ThemeProvider>
      <ChainProvider
        chains={includedChains}
        assetLists={assets}
        wallets={wallets}
        walletConnectOptions={{
          signClient: {
            projectId: 'a8510432ebb71e6948cfd6cde54b70f7',
            relayUrl: 'wss://relay.walletconnect.org',
            metadata: {
              name: 'Cosmos Kit dApp',
              description: 'Cosmos Kit dApp built by Create Cosmos App',
              url: 'https://docs.cosmology.zone/cosmos-kit/',
              icons: [],
            },
          },
        }}
      >
        <WalletAddressProvider>
          <BalancesProvider>
            <Box
              className={themeClass}
              minHeight="100dvh"
              backgroundColor={useColorModeValue('$white', '$background')}
            >
              <Component {...pageProps} />
            </Box>
          </BalancesProvider>
        </WalletAddressProvider>
      </ChainProvider>
    </ThemeProvider>
  );
}
export default CreateCosmosApp;