import { MouseEventHandler } from "react";
import { IconName, useColorModeValue } from "@interchain-ui/react";
import { Button } from "@chakra-ui/react";
import Image from "next/image";

export type ButtonProps = {
  text?: string;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export type ConnectProps = Pick<ButtonProps, "text" | "loading" | "onClick">;

function noop() {}

export function Button1({
  text,
  icon,
  loading,
  disabled,
  onClick = noop,
}: ButtonProps) {
  const backgroundColor = useColorModeValue(
    "rgb(240, 240, 240)",
    "rgb(52, 52, 52)"
  );
  const borderColor = useColorModeValue("black", "white");
  const inputColor = useColorModeValue("black", "white");
  return (
    <Button
      onClick={onClick}
      className="connect-button"
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      color={inputColor}
      isLoading={loading}
      disabled={disabled}
      borderRadius="13px"
      min-width="230px"
      paddingLeft="30px"
      paddingRight="30px"
      height="40px"
      fontWeight="bold"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }} // Flex styling for alignment
    >
      <Image
        src={require("../../images/crypto-wallet.png")}
        width={20}
        height={20}
        alt="Crypto Wallet"
        style={{ marginRight: "8px", marginBottom: "3px" }} // Spacing between image and text
      />
      {text}
    </Button>
  );
}

<Image src="/images/crypto-wallet.png" width={22} height={22} alt="Hallo" />;

export const ButtonConnect = ({
  text = "Connect Wallet",
  onClick = noop,
}: ConnectProps) => (
  <Button1 text={text} icon="walletFilled" onClick={onClick} />
);

export const ButtonConnected = ({
  text = "My Wallet",
  onClick = noop,
}: ConnectProps) => (
  <Button1 text={text} icon="walletFilled" onClick={onClick} />
);

export const ButtonDisconnected = ({
  text = "Connect Wallet",
  onClick = noop,
}: ConnectProps) => (
  <Button1 text={text} icon="walletFilled" onClick={onClick} />
);

export const ButtonConnecting = ({
  text = "Connecting ...",
  loading = true,
}: ConnectProps) => <Button1 text={text} loading={loading} />;

export const ButtonRejected = ({
  text = "Reconnect",
  onClick = noop,
}: ConnectProps) => (
  <Button1 text={text} icon="walletFilled" onClick={onClick} />
);

export const ButtonError = ({
  text = "Change Wallet",
  onClick = noop,
}: ConnectProps) => (
  <Button1 text={text} icon="walletFilled" onClick={onClick} />
);

export const ButtonNotExist = ({
  text = "Install Wallet",
  onClick = noop,
}: ConnectProps) => (
  <Button1 text={text} icon="walletFilled" onClick={onClick} />
);
