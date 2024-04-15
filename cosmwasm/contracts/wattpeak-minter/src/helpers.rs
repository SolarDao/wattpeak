use cosmwasm_std::Uint128;
use token_bindings::{DenomUnit, Metadata, TokenFactoryMsg};


pub struct NewDenom {
    pub name: String,
    pub description: Option<String>,
    pub symbol: String,
    pub decimals: u32,
    pub initial_balances: Option<Vec<InitialBalance>>,
}

pub struct InitialBalance {
    pub address: String,
    pub amount: Uint128,
}

pub fn create_denom_msg(subdenom: String, full_denom: String, denom: NewDenom) -> TokenFactoryMsg {
    TokenFactoryMsg::CreateDenom {
        subdenom,
        metadata: Some(Metadata {
            name: Some(denom.name),
            description: denom.description,
            denom_units: vec![
                DenomUnit {
                    denom: full_denom.clone(),
                    exponent: 0,
                    aliases: vec![],
                },
                DenomUnit {
                    denom: denom.symbol.clone(),
                    exponent: denom.decimals,
                    aliases: vec![],
                },
            ],
            base: Some(full_denom),
            display: Some(denom.symbol.clone()),
            symbol: Some(denom.symbol),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::CosmosMsg;
    use token_bindings::TokenFactoryMsg;

#[test]
    fn test_create_denom() {
        fn serialize_message(msg: &TokenFactoryMsg) -> Result<Vec<u8>, cosmwasm_std::StdError> {
            let serialized_msg = cosmwasm_std::to_vec(&msg)?;
            Ok(serialized_msg)
        }
        // Create an instance of MsgCreateDenom with example data
        let subdenom = "wattpeak".to_string();
        let full_denom = "wattpeak".to_string();
        let denom = NewDenom {
                name: "WattPeak".to_string(),
                description: Some("WattPeak is a token that represents the amount of wattpeak that a solarpanel represents".to_string()),
                symbol: "WattPeak".to_string(),
                decimals: 0,
                initial_balances: None,
            };

        let msg = create_denom_msg(subdenom, full_denom, denom);

        let serialized_msg = serialize_message(&msg).unwrap();

        // The type_url for the MsgCreateDenom based on its Protobuf definition
        let type_url = "/osmosis.tokenfactory.v1beta1.MsgCreateDenom";

        let expected_msg: CosmosMsg = CosmosMsg::Stargate {
            type_url: type_url.into(),
            value: cosmwasm_std::Binary(serialized_msg),
        };

        if let CosmosMsg::Stargate { type_url, value } = &expected_msg {
            assert_eq!(type_url, "/osmosis.tokenfactory.v1beta1.MsgCreateDenom");
            assert!(
                !value.0.is_empty(),
                "The serialized message should not be empty"
            );
        } else {
            panic!("Expected CosmosMsg::Stargate variant");
        }
    }
    #[test]
    fn test_serialization_cycle() {

        fn serialize_message(msg: &TokenFactoryMsg) -> Result<Vec<u8>, cosmwasm_std::StdError> {
            let serialized_msg = cosmwasm_std::to_vec(&msg)?;
            Ok(serialized_msg)
        }
        let msg = create_denom_msg(
            "WattPeak".to_string(),
            "full_wattpeak".to_string(),
            NewDenom { 
                name: "WattPeak".to_string(),
                description: Some("WattPeak is a token that represents the amount of wattpeak that a solarpanel represents".to_string()),
                symbol: "WattPeak".to_string(),
                decimals: 0,
                initial_balances: None,},
        );

        let serialized = serialize_message(&msg).unwrap();
        let deserialized: TokenFactoryMsg = cosmwasm_std::from_slice(&serialized).unwrap();

        // Assertions to check the deserialized content matches the original message
        match deserialized {
            TokenFactoryMsg::CreateDenom { subdenom, metadata } => {
                assert_eq!(subdenom, "WattPeak");
                assert_eq!(metadata.clone().unwrap().name.unwrap(), "WattPeak".to_string());
                assert_eq!(metadata.clone().unwrap().description, Some("WattPeak is a token that represents the amount of wattpeak that a solarpanel represents".to_string()));
                assert_eq!(metadata.clone().unwrap().denom_units[0].denom, "full_wattpeak");
                assert_eq!(metadata.clone().unwrap().denom_units[0].exponent, 0);
                assert_eq!(metadata.clone().unwrap().denom_units[1].denom, "WattPeak");
                assert_eq!(metadata.clone().unwrap().denom_units[1].exponent, 0);
            }
            _ => panic!("Unexpected message type"),
        }
    }
}use crate::{
    error::ContractError,
    state::{AVAILABLE_WATTPEAK_COUNT, CONFIG, PROJECTS, TOTAL_WATTPEAK_MINTED_COUNT},
};
use cosmwasm_std::{BankMsg, Coin, CosmosMsg, DepsMut, MessageInfo, Response, StdResult};

pub fn mint_tokens_msg(
    deps: DepsMut,
    info: MessageInfo,
    address: String,
    denom: String,
    amount: Uint128,
    project_id: u64,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
    // Validate sender is authorized to mint
    let config = CONFIG.load(deps.storage).unwrap();
    // Search for the project by name
    let projects = PROJECTS.range(deps.storage, None, None, cosmwasm_std::Order::Ascending);
    let mut project_opt = None;
    for item in projects {
        let (_, project) = item?;
        if project.id == project_id {
            project_opt = Some(project);
            break;
        }
    }
    let project = project_opt.ok_or(ContractError::ProjectNotFound {})?;
    println!("Project: {:?}", project);

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

    let mut project_update = PROJECTS.load(deps.storage, project.id)?;
    project_update.minted_wattpeak_count += amount.u128() as u64;
    PROJECTS.save(deps.storage, project.id, &project_update)?;

    println!("Project: {:?}", project);

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
