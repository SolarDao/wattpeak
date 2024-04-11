use crate::error::ContractError;
use crate::msg::InstantiateMsg;
use crate::state::{
    AVAILABLE_WATTPEAK_COUNT, CONFIG, PROJECT_DEALS_COUNT, TOTAL_WATTPEAK_MINTED_COUNT, DECIMALS, DESCRIPTION, FULL_DENOM, NAME, SUBDENOM, SYMBOL,
};
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response};
use helpers::{NewDenom, create_denom_msg};
use token_bindings::TokenFactoryMsg;

pub mod error;
pub mod execute;
pub mod helpers;
pub mod msg;
pub mod query;
pub mod state;

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
    msg.config.validate(deps.as_ref())?;
    CONFIG.save(deps.storage, &msg.config)?;

    PROJECT_DEALS_COUNT.save(deps.storage, &0).unwrap();

    AVAILABLE_WATTPEAK_COUNT.save(deps.storage, &0).unwrap();

    TOTAL_WATTPEAK_MINTED_COUNT.save(deps.storage, &0).unwrap();

    let denom = NewDenom {
        name: NAME.to_string(),
        description: Some(DESCRIPTION.to_string()),
        symbol: SYMBOL.to_string(),
        decimals: DECIMALS,
        initial_balances: None,
    };

    let create_denom_msg = create_denom_msg(SUBDENOM.to_string(), FULL_DENOM.to_string(), denom);

    Ok(Response::new().add_message(create_denom_msg))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::Config;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coin, coins, Addr, Decimal};

    #[test]
    fn test_initialization() {
        let mut deps = mock_dependencies();

        let info = mock_info("creator", &coins(1, "umpwr"));

        let config = Config {
            admin: info.sender.clone(),
            minting_payment_address: Addr::unchecked("mock_address_1"),
            minting_fee_percentage: Decimal::percent(5),
            minting_price: coin(1, "umpwr"),
            minting_fee_address: Addr::unchecked("mock_address_2"),
        };
        let res = instantiate(
            deps.as_mut(),
            mock_env(),
            info.clone(),
            InstantiateMsg {
                config: config.clone(),
            },
        )
        .unwrap();
        assert_eq!(1, res.messages.len());
        
        let loaded_config = CONFIG.load(deps.as_ref().storage).unwrap();
        assert_eq!(loaded_config, config);

        let project_deals_count = state::PROJECT_DEALS_COUNT
            .load(deps.as_ref().storage)
            .unwrap();
        assert_eq!(project_deals_count, 0);

        let available_wattpeak_count = state::AVAILABLE_WATTPEAK_COUNT
            .load(deps.as_ref().storage)
            .unwrap();
        assert_eq!(available_wattpeak_count, 0);

        let total_wattpeak_minted = state::TOTAL_WATTPEAK_MINTED_COUNT
            .load(deps.as_ref().storage)
            .unwrap();
        assert_eq!(total_wattpeak_minted, 0);
    }
}