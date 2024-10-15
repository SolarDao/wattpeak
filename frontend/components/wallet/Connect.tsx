import { MouseEventHandler } from "react";
import { Button, IconName, useColorModeValue } from "@interchain-ui/react";

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
    "rgba(0, 0, 0, 0.04)",
    "rgb(52, 52, 52)"
  );
  const borderColor = useColorModeValue("1px solid black", "1px solid white");
  return (
    <Button
      onClick={onClick}
      leftIcon={icon}
      disabled={disabled}
      isLoading={loading}
      className="connect-button"
      domAttributes={{
        style: {
          backgroundColor,
          borderColor,
          flex: 1,
          fontFamily: "Roboto",
          borderRadius: "13px",
          fontSize: "17px",
          height: "40px",
          width: "200px",
          border: "1px solid white",
        },
      }}
    >
      {text}
    </Button>
  );
}

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
