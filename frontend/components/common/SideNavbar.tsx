import { Box, useColorModeValue } from "@interchain-ui/react";
import Image from 'next/image';

// Import the PNG images
import settings from '../../public/settings.png';
import swap from '../../public/swap.png';
import faq from '../../images/faq.png';

const sideNavItems = [
  { icon: swap, id: "swapping" },
  { icon: faq, id: "faq" },
];

export const SideNavbar = ({ setCurrentSection }) => {
  return (
    <Box
      as="nav"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      gap="$10"
      py="$4"
      px="$2"
      marginLeft="$6"
      marginRight="$6"
      marginTop="$14"
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
          <Image src={item.icon} alt={item.id} width={25} height={22} />
        </Box>
      ))}
    </Box>
  );
};
