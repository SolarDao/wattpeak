import { useState } from 'react';
import { assets } from 'chain-registry';
import { AvailableItem, Box, SwapToken, SwapTokenProps } from '@interchain-ui/react';

const symbols = ['ATOM', 'OSMO', 'JUNO', 'STARS', 'BLD', 'STRD', 'CRO', 'AKT', 'MARS'];

const noop = () => {};

const dropdownList = symbols.map((symbol) => {
  const asset = assets.find((assetList) => assetList.assets[0].symbol === symbol)!.assets[0];

  return {
    imgSrc: asset.logo_URIs?.png || asset.logo_URIs?.jpeg || asset.logo_URIs?.svg,
    name: asset.name,
    symbol: asset.symbol,
    denom: asset.base,
    available: Number((Math.random() * 100).toFixed(6)),
    priceDisplayAmount: Math.floor(Math.random() * 10) + 1,
  } as AvailableItem;
});

export function Swap() {
  const [from, setFrom] = useState<SwapTokenProps['to']>({
    label: 'From',
    options: dropdownList ?? [],
    selected: dropdownList[0],
    amount: 0,
    onItemSelected: (selectedItem) => {
      console.log('From: onItemSelected', selectedItem);
      setFrom((prev) => ({
        ...prev,
        selected: selectedItem,
        options: prev?.options ?? [],
        amount: prev?.amount ?? 0,
        label: prev?.label ?? '',
        onItemSelected: prev?.onItemSelected ?? noop,
        onAmountChange: prev?.onAmountChange ?? noop,
        onAmountInput: prev?.onAmountInput ?? noop,
      }));
    },
  });

  const [to, setTo] = useState<SwapTokenProps['to']>({
    label: 'To',
    options: dropdownList ?? [],
    selected: dropdownList[1],
    amount: 0,
    onItemSelected: (selectedItem) => {
      console.log('To: onItemSelected', selectedItem);
      setFrom((prev) => ({
        ...prev,
        selected: selectedItem,
        options: prev?.options ?? [],
        amount: prev?.amount ?? 0,
        label: prev?.label ?? '',
        onItemSelected: prev?.onItemSelected ?? noop,
        onAmountChange: prev?.onAmountChange ?? noop,
        onAmountInput: prev?.onAmountInput ?? noop,
      }));
    },
  });

  const onToggleDirection = () => {
    const prevTo = to;
    const prevFrom = from;

    setTo({ ...prevFrom, label: 'To' });
    setFrom({ ...prevTo, label: 'From' });
  };

  return (
    <div id='swap-token-story'>
      <Box width='100%'>
        <SwapToken
          from={from}
          to={to}
          swapPrice={{
            hasRoute: true,
            priceImpact: '< 0.001%',
            swapFee: {
              percentage: '0.2%',
              value: '< $0.01',
            },
            routeDisabled: false,
            minimumReceived: 250.4,
          }}
          onToggleDirection={onToggleDirection}
          onSwap={() => {
            console.log('Swap');
          }}
          onToleranceChange={(percent) => {
            console.log('onToleranceChange', percent);
          }}
        />
      </Box>
    </div>
  );
}