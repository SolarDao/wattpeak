# WattPeak Minter contract


## Introduction
In this folder you can find all the code for the minting functionality of the Wattpeak Token (From here on referred to as $WP). In order to mint a $WP there first need to be a solarpark project uploaded to the contract and $WP connected to that contract available to mint. The current WattPeak contract is deployed on the Juno Network and utilizes Junos TokenFactory to mint $WP as native tokens. There are plans to migrate the contract to Empowerchain once a TokenFactory has been implemented there.

## Prerequisites

Before deploying the WattPeak Minter contract, ensure you have the following:

Go installed and configured
Juno CLI (junod) installed
A funded Juno wallet

## Contract Deployment

# Storing the contract

In order to instantiate the contract it first needs to be optimized and compiled, instructions to do this can be found in the README file in the root folder. In order to deploy the contract it first needs to be stored on the blockchain before instantiating. This can be done by running the following commands with the necessary flags in the artifacts folder:

junod tx wasm store wattpeak_minter.wasm --from <your_wallet> --chain-id your_chain_id --gas auto --gas-adjustment 1.3 -- node <applicable_node> --fees <applicable_fees>


# Instantiation

Once the contract code is stored on the blockchain it can be instantiated by running the following command:

junod tx wasm instantiate <code_id> '{"admin":"<admin_address>", "rewards_percentage": <percentage>, "epoch_length": <length>}' --from your_wallet --label "wattpeak_minter" --chain-id your_chain_id --gas auto --gas-adjustment 1.3

The code id can be found in the transaction histroy of the store transaction.

## Configuration



## Execute


## Query