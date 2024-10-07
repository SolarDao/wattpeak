import { Link, Tooltip } from "@chakra-ui/react";
import {
  Box,
  Button,
  Icon,
  useColorModeValue,
  useTheme,
} from "@interchain-ui/react";
import Image from "next/image";
import { useMediaQuery } from "react-responsive";

export const Footer = () => {
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const toggleColorMode = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      <Box
        as="footer"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        maxHeight="$15"
        marginTop="$10"
        marginLeft="$10"
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
        {!isMobile && (
          <Box flex="1" textAlign="center" marginLeft="120px">
            &copy; 2024 Solar DAO. All rights reserved.
          </Box>
        )}
        <Box display="flex" gap="12px">
          <Link
            isExternal
            textDecoration="underline"
            title="Trade Solar on Osmosois"
            href="https://www.stargaze.zone/m/stars1jxdssrjmuqxhrrajw4rlcdsmhf0drjf5kl4mdp339vng6lesd62s4uqy9q/tokens"
          >
            <Tooltip
              label="Cyber Solar Heroes on Stargaze"
              aria-label="Stargaze Tooltip"
              placement="left-start"
            >
              <Image
                src={require("../../images/Stargaze.png")}
                alt={""}
                width={30}
              />
            </Tooltip>
          </Link>
          <Link
            isExternal
            textDecoration="underline"
            href="https://daodao.zone/dao/juno1nwh5nnd7nlccn08wjv2zrenfxeudvc883z9sjthtzygahwmep6pqjezuh2/home"
          >
            <Tooltip
              label="SolarDAO on DaoDao"
              aria-label="DaoDao Tooltip"
              placement="bottom"
            >
              <Image
                src={require("../../images/yin_yang.png")}
                alt={""}
                width={30}
              />
            </Tooltip>
          </Link>
          <Link
            isExternal
            textDecoration="underline"
            href="https://solardao.carrd.co/"
          >
            <Tooltip
              label="SolarDAO website"
              aria-label="DaoDao Tooltip"
              placement="bottom"
            >
              <Image
                src={require("../../images/solar.png")}
                alt={""}
                height={30}
              />
            </Tooltip>
          </Link>
          <Link
            isExternal
            textDecoration="underline"
            href="https://app.osmosis.zone/?from=USDT&sellOpen=false&buyOpen=false&to=SOLAR"
          >
            <Tooltip
              label="$SOLAR on Osmosis"
              aria-label="Osmosis Tooltip"
              placement="right-start"
            >
              <Image
                src={require("../../images/osmosis-osmo-logo.png")}
                alt={""}
                width={30}
              />
            </Tooltip>
          </Link>
        </Box>
      </Box>
    </>
  );
};
