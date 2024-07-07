import {
  Box,
  Button,
  Icon,
  useColorModeValue,
  useTheme,
} from "@interchain-ui/react";

export const Footer = () =>{
  const { theme, setTheme } = useTheme();

  const toggleColorMode = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Box
    as="footer"
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    maxHeight="$15"
    marginTop="$10"
    marginLeft="$1"
    marginRight="$10"
    paddingBottom="$10"
    px="$4"
  >
    <Button
      intent="secondary"
      size="sm"
      attributes={{
        paddingX: 0,
      }}
      onClick={toggleColorMode}
    >
      <Icon name={useColorModeValue("moonLine", "sunLine")} />
    </Button>
    <Box flex="1" textAlign="center">
      &copy; 2024 Solar DAO. All rights reserved.
    </Box>
  </Box>
  );
};

