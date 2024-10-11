export const formatDenom = (denom: string) => {
    let formattedDenom = denom;
  
    if (denom.startsWith("factory")) {
      formattedDenom = denom.split("/").pop() as string;
    }
  
    if (formattedDenom.startsWith("u")) {
      formattedDenom = formattedDenom.slice(1);
    }
  
    if (formattedDenom === "stars" || formattedDenom === "junox") {
      formattedDenom = formattedDenom.toUpperCase();
    }
  
    if (formattedDenom === "wattpeakb") {
      formattedDenom = "WattPeak";
    }
  
    if (formattedDenom === "solar") {
      formattedDenom = "$SOLAR";
    }
    return formattedDenom;
  };