export const formatBalance = (amount: number) => {
    let num = amount / 1000000;
  
    // Determine suffix and adjust number accordingly
    let suffix = "";
    if (num >= 1000000) {
      num = num / 1000000;
      suffix = "M";
    } else if (num >= 1000) {
      num = num / 1000;
      suffix = "K";
    }
  
    // Format to 2 decimal places, and remove trailing zeroes
    if (num < 1) {
      // Format to 2 decimal places, and remove trailing zeroes
      let formattedNum = num.toFixed(6).replace(/\.?0+$/, "");
      return `${formattedNum}${suffix}`;
      }
  
      if (num >= 1) {
        let formattedNum = num.toFixed(2).replace(/\.?0+$/, "");
        return `${formattedNum}${suffix}`;
      }
  };
  
  export const formatBalanceNoConversion = (amount: number) => {
    let num = amount;
  
    // Determine suffix and adjust number accordingly
    let suffix = "";
    if (num >= 1000000) {
      num = num / 1000000;
      suffix = "M";
    } else if (num >= 1000) {
      num = num / 1000;
      suffix = "K";
    }
    
    if (num < 1) {
    // Format to 2 decimal places, and remove trailing zeroes
    let formattedNum = num.toFixed(6).replace(/\.?0+$/, "");
    return `${formattedNum}${suffix}`;
    }

    if (num >= 1) {
      let formattedNum = num.toFixed(2).replace(/\.?0+$/, "");
      return `${formattedNum}${suffix}`;
    }
  };