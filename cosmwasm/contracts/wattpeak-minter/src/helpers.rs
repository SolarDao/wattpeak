use crate::{
    error::ContractError,
    state::{Config, AVAILABLE_WATTPEAK_COUNT, CONFIG, TOTAL_WATTPEAK_MINTED_COUNT},
};
use cosmwasm_std::{
    BankMsg, Coin, CosmosMsg, DepsMut, Fraction, MessageInfo, Response, StdResult, Uint128,
};
use token_bindings::TokenFactoryMsg;

pub fn mint_tokens_msg(
    deps: DepsMut,
    info: MessageInfo,
    address: String,
    denom: String,
    amount: Uint128,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
    // Validate sender is authorized to mint
    let config = CONFIG.load(deps.storage).unwrap();

    // Calculate the total cost and fee based on the amount to mint
    let total_cost = calculate_total_cost(&config, amount)?;
    let minting_fee = calculate_minting_fee(&config, amount)?;

    if info.funds.iter().any(|coin| {
        coin.denom == config.minting_price.denom
            && coin.amount >= total_cost.amount + minting_fee.amount
    }) {
        // Proceed with minting
    } else {
        return Err(ContractError::InsufficientFunds {});
    }

    // Prepare messages for the payment and fee transfers
    let payment_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: config.minting_payment_address.to_string(),
        amount: vec![total_cost.clone()],
    });

    let fee_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: config.minting_fee_address.to_string(),
        amount: vec![minting_fee],
    });

    // Prepare the minting message
    let mint_msg = TokenFactoryMsg::MintTokens {
        denom,
        amount,
        mint_to_address: address,
    };

    AVAILABLE_WATTPEAK_COUNT.update(deps.storage, |available_wattpeak_count| {
        StdResult::Ok(available_wattpeak_count - amount.u128() as u64)
    })?;

    TOTAL_WATTPEAK_MINTED_COUNT.update(deps.storage, |total_wattpeak_minted_count| {
        StdResult::Ok(total_wattpeak_minted_count + amount.u128() as u64)
    })?;

    // Assuming your contract's execution logic proceeds with these messages
    Ok(Response::new()
        .add_message(payment_msg)
        .add_message(fee_msg)
        .add_message(mint_msg)
        .add_attribute("action", "mint_tokens"))
}

fn calculate_total_cost(config: &Config, amount: Uint128) -> Result<Coin, ContractError> {
    // Example: Calculate the total cost based on minting_price and amount
    let price_per_unit = config.minting_price.amount;
    let total_cost_amount = price_per_unit.multiply_ratio(amount.u128(), 1u128);
    Ok(Coin {
        denom: config.minting_price.denom.clone(),
        amount: total_cost_amount,
    })
}

fn calculate_minting_fee(config: &Config, amount: Uint128) -> Result<Coin, ContractError> {
    // Calculate the minting fee based on minting_fee_percentage
    let fee_percentage = config.minting_fee_percentage;
    let fee_amount =
        amount.multiply_ratio(fee_percentage.numerator(), fee_percentage.denominator());
    Ok(Coin {
        denom: config.minting_price.denom.clone(), // Assuming the fee is paid in the same denom as minting price
        amount: fee_amount,
    })
}
