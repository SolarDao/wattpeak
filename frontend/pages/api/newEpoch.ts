import { NextApiRequest, NextApiResponse } from 'next';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice, calculateFee } from '@cosmjs/stargate';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Restrict to POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Load environment variables
    const MNEMONIC = process.env.MNEMONIC;
    const RPC_ENDPOINT = "https://juno-testnet-rpc.polkachu.com:443";
    const CONTRACT_ADDRESS = "juno1037vhwjt6khhqlc04pmcu72nrsv3c98pnsswn9vsjsm26vh09qus78q5xz";
    const API_KEY = process.env.EPOCH_API_KEY; // For securing the endpoint

    // Check for missing environment variables
    if (!MNEMONIC || !RPC_ENDPOINT || !CONTRACT_ADDRESS || !API_KEY) {
      return res.status(500).json({ error: 'Missing required environment variables.' });
    }

    // Basic API key authentication
    const providedApiKey = req.headers['x-api-key'];
    if (providedApiKey !== API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Hard-coded variables
    const GAS_PRICE_AMOUNT = '0.025'; // Corrected gas price amount
    const GAS_PRICE_DENOM = 'ujunox';
    const ADDRESS_PREFIX = 'juno';

    // Initialize wallet
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
      prefix: ADDRESS_PREFIX,
    });
    const [account] = await wallet.getAccounts();

    // Initialize client
    const gasPrice = GasPrice.fromString(`${GAS_PRICE_AMOUNT}${GAS_PRICE_DENOM}`);
    const client = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, wallet, {
      gasPrice,
    });

    // Prepare the message to call new_epoch
    const msg = {
      new_epoch: {},
    };

    // Estimate gas and calculate fee
    const gasLimit = 300_000; // Adjust based on your contract's needs
    const fee = calculateFee(gasLimit, gasPrice);

      // Execute the transaction
    await client.execute(
        account.address,
        CONTRACT_ADDRESS,
        msg,
        fee,
        'Executing new_epoch' // Optional memo
      );

    console.log('Transaction result:');
    // Return success response
    res.status(200).json({ message: 'new_epoch executed successfully.' });
  } catch (error) {
    console.error('Error executing new_epoch:', error);
    const errorMessage = (error as Error).message;
    res.status(500).json({ error: 'Error executing new_epoch.', details: errorMessage });
  }
}

