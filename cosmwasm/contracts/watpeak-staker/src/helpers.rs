use crate::state::{CONFIG, STAKERS, TOTAL_WATTPEAK_STAKED};
use cosmwasm_std::{DepsMut, Env, Order, StdResult, Uint128};

pub fn calculate_interest_after_epoch(deps: DepsMut, env: Env) -> StdResult<()> {
    let stakers = STAKERS.range(deps.storage, None, None, Order::Ascending).collect::<StdResult<Vec<_>>>()?;

    for (key, mut staker) in stakers {
        let time_staked = staker.stake_start_time;
        let current_time = env.block.time.seconds();
        println!("Current time: {:?}", current_time);
        let time_staked_seconds = current_time.checked_sub(time_staked).unwrap();
        println!("Time staked seconds: {:?}", time_staked_seconds);
        let percentage_of_year = time_staked_seconds.checked_div(31556926).unwrap();
        println!("Percentage of year: {:?}", percentage_of_year);
        let interest_rate = CONFIG.load(deps.storage)?.rewards_percentage.checked_div(Uint128::from(100u128)).unwrap();
        let additional_interest_per_year = staker.wattpeak_staked.checked_mul(interest_rate).unwrap();
        let additional_interest = additional_interest_per_year.checked_mul(percentage_of_year.into()).unwrap();

        staker.interest_wattpeak = staker.interest_wattpeak.checked_add(additional_interest).unwrap();
        println!("Staker: {:?}", staker);
        
        // Save the updated staker information
        STAKERS.save(deps.storage, key, &staker)?;
    }

    Ok(())
}

pub fn calculate_staker_share_of_reward(deps: DepsMut, _env: Env, amount: Uint128) -> StdResult<()> {
    let total_wattpeak_staked = TOTAL_WATTPEAK_STAKED.load(deps.storage)?;
    let stakers = STAKERS.range(deps.storage, None, None, Order::Ascending).collect::<StdResult<Vec<_>>>()?;

    for (key, mut staker) in stakers {
        let share = staker.wattpeak_staked.checked_div(total_wattpeak_staked).unwrap();
        let reward = amount.checked_mul(share).unwrap();

        staker.claimable_rewards = staker.claimable_rewards.checked_add(reward).unwrap();
        
        // Save the updated staker information
        STAKERS.save(deps.storage, key, &staker)?;
    }
    Ok(())
}#[cfg(test)]
mod tests {
    use crate::state::{Config, Staker};

    use super::*;
    use cosmwasm_std::{
        testing::{mock_dependencies, mock_env},
        Addr, Timestamp, Uint128,
    };

    #[test]
    fn test_calculate_interest_after_epoch() {
        let mut deps = mock_dependencies();

        // Initialize environment with current block time
        let current_time = 1_600_000_000;  // This should match your context's needs
        let mut env = mock_env();
        env.block.time = Timestamp::from_seconds(current_time);

        // Instantiate and store the Config object first
        let config = Config {
            admin: Addr::unchecked("admin"),  // Example admin address
            rewards_percentage: Uint128::new(5),  // Example rewards percentage
        };
        CONFIG.save(&mut deps.storage, &config).unwrap();

        // Example stakers setup
        let stakers = [
            Staker {
                address: Addr::unchecked("addr1"),
                wattpeak_staked: Uint128::from(100u128),
                interest_wattpeak: Uint128::zero(),
                stake_start_time: current_time - 50000,
                claimable_rewards: Uint128::zero(),
            },
            Staker {
                address: Addr::unchecked("addr2"),
                wattpeak_staked: Uint128::from(200u128),
                interest_wattpeak: Uint128::zero(),
                stake_start_time: current_time - 80000,
                claimable_rewards: Uint128::zero(),
            },
            Staker {
                address: Addr::unchecked("addr3"),
                wattpeak_staked: Uint128::from(300u128),
                interest_wattpeak: Uint128::zero(),
                stake_start_time: current_time - 100000,
                claimable_rewards: Uint128::zero(),
            },
        ];

        for staker in &stakers {
            STAKERS.save(&mut deps.storage, staker.address.clone(), staker).unwrap();
        }

        calculate_interest_after_epoch(deps.as_mut(), env).unwrap();

        let updated_staker1 = STAKERS.load(&deps.storage, stakers[0].address.clone()).unwrap();
        let updated_staker2 = STAKERS.load(&deps.storage, stakers[1].address.clone()).unwrap();
        let updated_staker3 = STAKERS.load(&deps.storage, stakers[2].address.clone()).unwrap();

        println!("Staker 1: {:?}", updated_staker1);
        println!("Staker 2: {:?}", updated_staker2);
        println!("Staker 3: {:?}", updated_staker3);

        assert!(updated_staker1.interest_wattpeak > Uint128::zero());
        assert!(updated_staker2.interest_wattpeak > Uint128::zero());
        assert!(updated_staker3.interest_wattpeak > Uint128::zero());
    }
}
