use crate::{
    error::ContractError,
    state::{AVAILABLE_WATTPEAK_COUNT, CONFIG, PROJECTS, TOTAL_WATTPEAK_MINTED_COUNT},
};
use cosmwasm_std::{BankMsg, Coin, CosmosMsg, DepsMut, MessageInfo, Response, StdResult, Uint128};
use token_bindings::TokenFactoryMsg;

pub fn mint_tokens_msg(
    deps: DepsMut,
    info: MessageInfo,
    address: String,
    denom: String,
    amount: Uint128,
    project_name: String,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
    // Validate sender is authorized to mint
    let config = CONFIG.load(deps.storage).unwrap();
    // Search for the project by name
    let projects = PROJECTS.range(deps.storage, None, None, cosmwasm_std::Order::Ascending);
    let mut project_opt = None;
    for item in projects {
        let (_, project) = item?;
        if project.name == project_name {
            project_opt = Some(project);
            break;
        }
    }
    let project = project_opt.ok_or(ContractError::ProjectNotFound {})?;

    if amount.u128() > (project.max_wattpeak - project.minted_wattpeak_count) as u128 {
        return Err(ContractError::InsufficientWattpeak {});
    }

    // Calculate the total cost and fee based on the amount to mint
    let minting_price = amount * config.minting_price.amount;

    let minting_fee = minting_price * config.minting_fee_percentage;
    let total_cost = Uint128::from(minting_price) + Uint128::from(minting_fee);

    if info.funds.iter().any(|coin| coin.amount < total_cost) {
        return Err(ContractError::InsufficientFunds {});
    }
    if info.funds.iter().any(|coin| coin.amount > total_cost) {
        return Err(ContractError::ToomuchFunds {});
    }

    // Prepare messages for the payment and fee transfers
    let payment_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: config.minting_payment_address.to_string(),
        amount: vec![Coin {
            denom: config.minting_price.denom.clone(),
            amount: minting_price,
        }],
    });

    let fee_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: config.minting_fee_address.to_string(),
        amount: vec![Coin {
            denom: config.minting_price.denom.clone(),
            amount: minting_fee,
        }],
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
