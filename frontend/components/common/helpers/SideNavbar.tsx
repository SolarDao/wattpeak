import { Box, useColorModeValue } from "@interchain-ui/react";
import Image from 'next/image';
import swap from '../../../images/swap.png';
import faq from '../../../images/faq.png';

const sideNavItems = [
  { icon: swap, id: "swapping" },
  { icon: faq, id: "faq" },
];

export const SideNavbar = ({ setCurrentSection }: { setCurrentSection: (id: string) => void }) => {
  const inputColor  = useColorModeValue("$gray900", "$gray100");
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
     {/*  {sideNavItems.map((item) => (
        <Box
          key={item.id}
          as="a"
          // @ts-ignore
          onClick={() => setCurrentSection(item.id)}
          color={inputColor}
          fontWeight="$medium"
          fontSize={{ mobile: "$xl", tablet: "$2xl" }}
          my="$2"
          cursor="pointer"
          textDecoration="none"
        >
          <Image src={item.icon} alt={item.id} width={25} height={22} />
        </Box>
      ))} */}
    </Box>
  );
};
