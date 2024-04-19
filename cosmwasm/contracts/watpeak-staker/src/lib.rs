pub mod error;
pub mod msg;
pub mod state;
pub mod execute;
pub mod query;
pub mod helpers;


use crate::msg::InstantiateMsg;
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdResult};
use error::ContractError;
use state::{EpochState, CONFIG, TOTAL_WATTPEAK_STAKED, EPOCH_STATE};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response<ContractError>>{

    let epoch_state = EpochState {
        epoch_length: 86000,
        current_epoch: 1,
        epoch_start_time: env.block.time.seconds(),
    };

    CONFIG.save(deps.storage, &msg.config)?;
    EPOCH_STATE.save(deps.storage, &epoch_state)?; // Fix the save method call
    TOTAL_WATTPEAK_STAKED.save(deps.storage, &0u64.into())?;

    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{msg::InstantiateMsg, state::Config};
    use cosmwasm_std::{
        testing::{mock_dependencies, mock_env, mock_info}, Addr, Timestamp, Uint128
    };

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(1_600_000_000);  // Example fixed time for testing

        let msg = InstantiateMsg {
            config: Config {
                admin: Addr::unchecked("admin"),
                rewards_percentage: From::from(10u128),
            },
        };

        let info = mock_info("creator", &[]);
        let res = instantiate(deps.as_mut(), env, info, msg).unwrap();
        assert_eq!(0, res.messages.len());

        let saved_config = CONFIG.load(deps.as_ref().storage).unwrap();
        assert_eq!(saved_config.admin, Addr::unchecked("admin"));
        assert_eq!(saved_config.rewards_percentage, Uint128::from(10u128));

        let saved_epoch_state = EPOCH_STATE.load(deps.as_ref().storage).unwrap();
        assert_eq!(saved_epoch_state.epoch_length, 86000);
        assert_eq!(saved_epoch_state.current_epoch, 1);
        assert_eq!(saved_epoch_state.epoch_start_time, 1_600_000_000);

        let total_wattpeak: u128 = TOTAL_WATTPEAK_STAKED.load(deps.as_ref().storage).unwrap().into();
        assert_eq!(total_wattpeak, Uint128::zero().into());

    }
}