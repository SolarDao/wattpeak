use crate::state::{CONFIG, STAKERS};
use cosmwasm_std::{DepsMut, Env, Order, StdResult, Uint128};

pub fn calculate_interest_after_epoch(deps: DepsMut, env: Env) -> StdResult<()> {
    let stakers = STAKERS.range(deps.storage, None, None, Order::Ascending).collect::<StdResult<Vec<_>>>()?;

    for (key, mut staker) in stakers {
        let time_staked = staker.stake_start_time;
        let current_time = env.block.time.seconds();
        let time_staked_seconds = current_time.checked_sub(time_staked).unwrap();
        let percentage_of_year = time_staked_seconds.checked_div(31556926).unwrap();
        let interest_rate = CONFIG.load(deps.storage)?.rewards_percentage.checked_div(Uint128::from(100u128)).unwrap();
        let additional_interest_per_year = staker.wattpeak_staked.checked_mul(interest_rate).unwrap();
        let additional_interest = additional_interest_per_year.checked_mul(percentage_of_year.into()).unwrap();

        staker.interest_wattpeak = staker.interest_wattpeak.checked_add(additional_interest).unwrap();
        
        // Save the updated staker information
        STAKERS.save(deps.storage, key, &staker)?;
    }

    Ok(())
}