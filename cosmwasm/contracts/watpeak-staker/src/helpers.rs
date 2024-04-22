use std::str::FromStr;

use crate::state::{CONFIG, STAKERS, TOTAL_INTEREST_WATTPEAK};
use cosmwasm_std::{Decimal, DepsMut, Env, Order, StdResult, Uint128};

pub fn calculate_interest_after_epoch(deps: DepsMut, env: Env) -> StdResult<()> {
    let stakers = STAKERS
        .range(deps.storage, None, None, Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;
    let mut total_wattpeak_interest_earned_during_period = Decimal::zero();

    for (key, mut staker) in stakers {
        let time_staked = Decimal::from_ratio(staker.stake_start_time, 1u64);
        let current_time = Decimal::from_ratio(env.block.time.seconds(), 1u64);
        let time_staked_seconds = current_time.checked_sub(time_staked).unwrap();
        let one_year = Decimal::from_ratio(31556926u64, 1u64);
        let percentage_of_year = time_staked_seconds.checked_div(one_year).unwrap();
        let interest_rate = CONFIG.load(deps.storage)?.rewards_percentage;

        let wattpeak_staked = Decimal::from_ratio(staker.wattpeak_staked, 1u64);
        let wattpeak_interest_per_year = wattpeak_staked.checked_mul(interest_rate).unwrap();
        let wattpeak_interest_earned = wattpeak_interest_per_year
            .checked_mul(percentage_of_year)
            .unwrap();
        total_wattpeak_interest_earned_during_period = total_wattpeak_interest_earned_during_period
            .checked_add(wattpeak_interest_earned)
            .unwrap();
        staker.interest_wattpeak = staker
            .interest_wattpeak
            .checked_add(wattpeak_interest_earned)
            .unwrap();

        // Save the updated staker information
        STAKERS.save(deps.storage, key, &staker)?;
    }
    TOTAL_INTEREST_WATTPEAK.save(deps.storage, &total_wattpeak_interest_earned_during_period)?;

    Ok(())
}

pub fn calculate_staker_share_of_reward(
    deps: DepsMut,
    _env: Env,
    amount: Uint128,
) -> StdResult<()> {
    let total_interest_wattpeak = TOTAL_INTEREST_WATTPEAK.load(deps.storage)?;
    let stakers = STAKERS
        .range(deps.storage, None, None, Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;
    let decimal_amount = Decimal::from_str(&amount.to_string()).unwrap();

    for (key, mut staker) in stakers {
        let share = staker
            .interest_wattpeak
            .checked_div(total_interest_wattpeak)
            .unwrap();
        let reward = decimal_amount.checked_mul(share).unwrap();
        staker.claimable_rewards = staker.claimable_rewards.checked_add(reward).unwrap();
        staker.interest_wattpeak = Decimal::zero();
        TOTAL_INTEREST_WATTPEAK.save(deps.storage, &Decimal::zero())?;

        // Save the updated staker information
        STAKERS.save(deps.storage, key, &staker)?;
    }
    Ok(())
}
#[cfg(test)]
mod tests {

    use crate::state::{Config, Staker};
    use cosmwasm_std::Decimal;

    use super::*;
    use cosmwasm_std::{
        testing::{mock_dependencies, mock_env},
        Addr, Timestamp, Uint128,
    };

    #[test]
    fn test_calculate_interest_after_epoch() {
        let mut deps = mock_dependencies();

        // Initialize environment with current block time
        let current_time = 1_600_000_000; // This should match your context's needs
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(current_time);

        let config = Config {
            admin: Addr::unchecked("admin"),          // Example admin address
            rewards_percentage: Decimal::percent(10), // Example rewards percentage
        };
        CONFIG.save(&mut deps.storage, &config).unwrap();

        // Example stakers setup
        let stakers = [
            Staker {
                address: Addr::unchecked("addr1"),
                wattpeak_staked: Uint128::from(100u128),
                interest_wattpeak: Decimal::zero(),
                stake_start_time: current_time - 50000,
                claimable_rewards: Decimal::zero(),
            },
            Staker {
                address: Addr::unchecked("addr2"),
                wattpeak_staked: Uint128::from(200u128),
                interest_wattpeak: Decimal::zero(),
                stake_start_time: current_time - 86400,
                claimable_rewards: Decimal::zero(),
            },
            Staker {
                address: Addr::unchecked("addr3"),
                wattpeak_staked: Uint128::from(300u128),
                interest_wattpeak: Decimal::zero(),
                stake_start_time: current_time - 100000,
                claimable_rewards: Decimal::zero(),
            },
        ];

        for staker in &stakers {
            STAKERS
                .save(&mut deps.storage, staker.address.clone(), staker)
                .unwrap();
        }

        calculate_interest_after_epoch(deps.as_mut(), env).unwrap();

        let updated_staker1 = STAKERS
            .load(&deps.storage, stakers[0].address.clone())
            .unwrap();
        let updated_staker2 = STAKERS
            .load(&deps.storage, stakers[1].address.clone())
            .unwrap();
        let updated_staker3 = STAKERS
            .load(&deps.storage, stakers[2].address.clone())
            .unwrap();

        let total_interest = TOTAL_INTEREST_WATTPEAK.load(&deps.storage);
        assert_eq!(
            total_interest.unwrap(),
            Decimal::from_ratio(16566886140937806u128, 100000000000000000u128)
        );
        assert_eq!(
            updated_staker1.interest_wattpeak,
            Decimal::from_ratio(1584438230770639u128, 100000000000000000u128)
        );
        assert_eq!(
            updated_staker2.interest_wattpeak,
            Decimal::from_ratio(547581852554333u128, 10000000000000000u128)
        );
        assert_eq!(
            updated_staker3.interest_wattpeak,
            Decimal::from_ratio(9506629384623837u128, 100000000000000000u128)
        );
    }
}
