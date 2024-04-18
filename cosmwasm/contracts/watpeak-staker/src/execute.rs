
use cosmwasm_std::{
    entry_point, BankMsg, Coin, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
};

use crate::{
    error::ContractError,
    msg::ExecuteMsg,
    state::{EpochState, Staker, EPOCH_STATE, STAKERS, TOTAL_WATTPEAK_STAKED},
};

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response<ContractError>> {

    EpochState::check_update_epoch(&mut EPOCH_STATE.load(deps.storage)?, &env);

    match msg {
        ExecuteMsg::Stake { amount } => stake_wattpeak(deps, env, info, amount),
    }
}

fn stake_wattpeak(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> StdResult<Response<ContractError>> {
    let staker_address = info.sender.clone();

    if info.sender == STAKERS.load(deps.storage, staker_address.clone())?.address {
        STAKERS.update(
            deps.storage,
            staker_address.clone(),
            |staker| -> StdResult<Staker> {
                let mut staker = staker.unwrap();
                staker.wattpeak_staked += amount;
                Ok(staker)
            },
        )?;
    } else {
        let staker = Staker {
            address: info.sender.clone(),
            wattpeak_staked: amount,
            interest_wattpeak: Uint128::from(0u128),
            stake_start_time: env.block.time.seconds(),
        };

        STAKERS.save(deps.storage, info.sender.clone(), &staker)?;
    }

    let total_wattpeak_staked = TOTAL_WATTPEAK_STAKED.load(deps.storage).unwrap().checked_add(amount).unwrap();
    TOTAL_WATTPEAK_STAKED.save(deps.storage, &total_wattpeak_staked)?;

    let payment_msg = BankMsg::Send {
        to_address: env.contract.address.to_string(),
        amount: vec![Coin {
            denom: "WattPeak".to_string(),
            amount: amount,
        }],
    };

    Ok(Response::new()
        .add_message(payment_msg)
        .add_attribute("action", "stake")
        .add_attribute("from", info.sender)
        .add_attribute("amount", amount))
}

