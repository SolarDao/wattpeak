import { Box, useColorModeValue } from "@interchain-ui/react";
import Image from 'next/image';

// Import the PNG images
import settings from '../../public/settings.png';
import swap from '../../public/swap.png';
import analytics from '../../public/analytics.png';

const sideNavItems = [
  { icon: swap, id: "swapping" },
  { icon: settings, id: "settings" },
  { icon: analytics, id: "analytics" },
];

export const SideNavbar = ({ setCurrentSection }) => {
  return (
    <Box
      as="nav"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      py="$4"
      px="$2"
      height="100vh"
      marginLeft="$6"
      marginRight="$6"
    >
      {sideNavItems.map((item) => (
        <Box
          key={item.id}
          as="a"
          onClick={() => setCurrentSection(item.id)}
          color={useColorModeValue("$gray900", "$gray100")}
          fontWeight="$medium"
          fontSize={{ mobile: "$xl", tablet: "$2xl" }}
          my="$2"
          cursor="pointer"
          textDecoration="none"
        >
          <Image src={item.icon} alt={item.id} width={32} height={32} />
        </Box>
      ))}
    </Box>
  );
};
