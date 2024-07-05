import '../styles/globals.css';
import '@interchain-ui/react/styles';

import type { AppProps } from 'next/app';
import { SignerOptions, wallets } from 'cosmos-kit';
import { ChainProvider } from '@cosmos-kit/react';
import { assets, chains } from 'chain-registry';
import {
  Box,
  ThemeProvider,
  useColorModeValue,
} from '@interchain-ui/react';
import { customTheme } from '../config/theme'; // Import the custom theme

function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const signerOptions: SignerOptions = {
    // signingStargate: () => {
    //   return getSigningCosmosClientOptions();
    // }
  };

  return (
    <ThemeProvider
      themeDefs={[customTheme]}
      customTheme="custom"
    >
      <ChainProvider
        chains={chains}
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
        // @ts-ignore
        signerOptions={signerOptions}
      >
        <CustomBackground>
          {/* @ts-ignore */}
          <Component {...pageProps} />
        </CustomBackground>
      </ChainProvider>
    </ThemeProvider>
  );
}

const CustomBackground = ({ children }) => {
  const backgroundLight = 'linear-gradient(116.82deg, #FCB023 0%, #141406 99.99%, #070D1C 100%)';
  const backgroundDark = '#070D1C'; // This can be customized as needed
  const background = useColorModeValue(backgroundLight, backgroundDark);

  return (
    <Box
      minHeight="100vh"
      sx={{
        background,
      }}
    >
      {children}
    </Box>
  );
};

export default CreateCosmosApp;
