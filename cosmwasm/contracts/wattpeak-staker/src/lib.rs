pub mod error;
pub mod msg;
pub mod state;
pub mod execute;
pub mod query;
pub mod helpers;


use crate::msg::InstantiateMsg;
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdResult};
use helpers::set_yearly_percentage;
use state:: {CONFIG, EPOCH_COUNT, TOTAL_WATTPEAK_STAKED};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response<>>{

    msg.config.validate(deps.as_ref())?;
    CONFIG.save(deps.storage, &msg.config)?;
    TOTAL_WATTPEAK_STAKED.save(deps.storage, &0u64.into())?;
    EPOCH_COUNT.save(deps.storage, &0u64)?;

    let epoch_length = msg.config.epoch_length;

    set_yearly_percentage(deps, epoch_length)?;

    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{msg::InstantiateMsg, state::Config};
    use cosmwasm_std::{
        testing::{mock_dependencies, mock_env, mock_info}, Addr, Decimal, Timestamp, Uint128
    };

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(1_600_000_000);  // Example fixed time for testing

        let msg = InstantiateMsg {
            config: Config {
                admin: Addr::unchecked("admin"),
                rewards_percentage: Decimal::percent(10),
                epoch_length: 86400,
            },
        };

        let info = mock_info("creator", &[]);
        let res = instantiate(deps.as_mut(), env, info, msg).unwrap();
        assert_eq!(0, res.messages.len());

        let saved_config = CONFIG.load(deps.as_ref().storage).unwrap();
        assert_eq!(saved_config.admin, Addr::unchecked("admin"));
        assert_eq!(saved_config.rewards_percentage, Decimal::percent(10));

        let total_wattpeak: u128 = TOTAL_WATTPEAK_STAKED.load(deps.as_ref().storage).unwrap().into();
        assert_eq!(total_wattpeak, Uint128::zero().into());

    }
}