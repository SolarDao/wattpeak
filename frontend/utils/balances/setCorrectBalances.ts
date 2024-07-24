function setCorrectBalances(balances: string[]) {
    setJunoBalance(
      balances?.find((balance) => balance.denom === "ujunox")?.amount /
        1000000 || 0
    );
    setWattpeakBalance(
      balances?.find(
        (balance) =>
          balance.denom ===
          "factory/juno16g2g3fx3h9syz485ydqu26zjq8plr3yusykdkw3rjutaprvl340sm9s2gn/uwattpeaka"
      )?.amount / 1000000 || 0
    );
  }