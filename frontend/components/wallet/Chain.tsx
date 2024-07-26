import { useEffect, useMemo, useState } from "react";
import { Chains } from "@chain-registry/types";

export type ChainSelectProps = {
  chains: Chains;
  chainName?: string;
  onChange?: (chainName?: string) => void;
};

export function ChainSelect({
  chainName,
  chains = [],
  onChange = () => {},
}: ChainSelectProps) {
  const [value, setValue] = useState<string>();

  const cache = useMemo(
    () =>
      chains.reduce(
        (cache, chain) => ((cache[chain.chain_name] = chain), cache),
        {} as Record<string, Chains[number]>
      ),
    [chains]
  );

  useEffect(() => {
    if (chainName && chains.length > 0) {
      const chain = cache[chainName];

      if (chain) {
        setValue(chain.chain_name);
        onChange(chain.chain_name);
      }
    } else {
      setValue(undefined);
    }
  }, [chains, chainName, cache, onChange]);

  return null; // No UI needed
}
