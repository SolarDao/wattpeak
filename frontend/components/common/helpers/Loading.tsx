import { Box } from "@chakra-ui/react";
import { Spinner } from "@interchain-ui/react";

export const Loading = () => {
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      backgroundColor="rgba(0, 0, 0, 0.5)"
      zIndex="9999"
    >
      <Spinner size="$10xl" color="white" />
    </Box>
  );
};
