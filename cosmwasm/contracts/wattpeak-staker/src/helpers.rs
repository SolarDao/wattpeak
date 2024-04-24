use std::str::FromStr;

use crate::state::{CONFIG, PERCENTAGE_OF_YEAR, STAKERS, TOTAL_INTEREST_WATTPEAK};
use cosmwasm_std::{Decimal, DepsMut, Env, Order, Response, StdResult, Uint128};

pub fn calculate_percentage_of_year(deps: DepsMut, epoch_length: u64) -> StdResult<()> {
    let time_staked = Decimal::from_ratio(epoch_length, 1u64);
    let one_year = Decimal::from_ratio(31556926u64, 1u64);
    let percentage_of_year = time_staked.checked_div(one_year).unwrap();
    PERCENTAGE_OF_YEAR.save(deps.storage, &percentage_of_year)?;
    Ok(())
}

pub fn calculate_interest_after_epoch(deps: DepsMut) -> StdResult<Response> {
    let stakers = STAKERS
        .range(deps.storage, None, None, Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;
    let mut total_wattpeak_interest_earned_during_period = Decimal::zero();
    let percentage_of_year = PERCENTAGE_OF_YEAR.load(deps.storage)?;
    let interest_rate = CONFIG.load(deps.storage)?.rewards_percentage;
    for (key, mut staker) in stakers {
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

    Ok(Response::default())
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

        // Save the updated staker information
        STAKERS.save(deps.storage, key, &staker)?;
    }
    TOTAL_INTEREST_WATTPEAK.save(deps.storage, &Decimal::zero())?;
    Ok(())
}
#[cfg(test)]
mod tests {

    use crate::{instantiate, msg::{ExecuteMsg, InstantiateMsg}, state::Config};
    use cosmwasm_std::{testing::mock_info, Coin, Decimal};
    use crate::execute::execute;
    use super::*;
    use cosmwasm_std::{
        testing::{mock_dependencies, mock_env},
        Addr,
    };

    #[test]
    fn test_calculate_interest_after_epoch() {
        let mut deps = mock_dependencies();

        let config = Config {
            admin: Addr::unchecked("admin"),          // Example admin address
            rewards_percentage: Decimal::percent(10), // Example rewards percentage
            epoch_length: 86000,                      // Example epoch length
        };
        CONFIG.save(&mut deps.storage, &config).unwrap();

        let env = mock_env();
        let info = mock_info("anyone", &[]);
        let msg = InstantiateMsg { config };
        let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();
        
        let staker_info1 = mock_info("addr1", &[Coin::new(100000000u128, "WattPeak")]);
        let staker_info2 = mock_info("addr2", &[Coin::new(200000000u128, "WattPeak")]);
        let staker_info3 = mock_info("addr3", &[Coin::new(300000000u128, "WattPeak")]);

        execute(
            deps.as_mut(),
            env.clone(),
            staker_info1.clone(),
            ExecuteMsg::Stake {},
        )
        .unwrap();

        execute(
            deps.as_mut(),
            env.clone(),
            staker_info2.clone(),
            ExecuteMsg::Stake {},
        )
        .unwrap();

        execute(
            deps.as_mut(),
            env.clone(),
            staker_info3.clone(),
            ExecuteMsg::Stake {},
        )
        .unwrap();

        calculate_interest_after_epoch(deps.as_mut()).unwrap();

        let updated_staker1 = STAKERS
            .load(&deps.storage, staker_info1.sender)
            .unwrap();
        let updated_staker2 = STAKERS
            .load(&deps.storage, staker_info2.sender)
            .unwrap();
        let updated_staker3 = STAKERS
            .load(&deps.storage, staker_info3.sender)
            .unwrap();

        let total_interest = TOTAL_INTEREST_WATTPEAK.load(&deps.storage);
        assert_eq!(
            total_interest.unwrap(),
            Decimal::from_ratio(16351402541553u128, 100000000u128)
        );
        assert_eq!(
            updated_staker1.interest_wattpeak,
            Decimal::from_ratio(27252337569255u128, 1000000000u128)
        );
        assert_eq!(
            updated_staker2.interest_wattpeak,
            Decimal::from_ratio(5450467513851u128, 100000000u128)
        );
        assert_eq!(
            updated_staker3.interest_wattpeak,
            Decimal::from_ratio(81757012707765u128, 1000000000u128)
        );
    }
    #[test]
    fn multiple_epoch_calculation() {
        let mut deps = mock_dependencies();

        let config = Config {
            admin: Addr::unchecked("admin"),          // Example admin address
            rewards_percentage: Decimal::percent(10), // Example rewards percentage
            epoch_length: 86000,                      // Example epoch length
        };
        CONFIG.save(&mut deps.storage, &config).unwrap();

        let env = mock_env();
        let info = mock_info("anyone", &[]);
        let msg = InstantiateMsg { config };
        let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();
        
        let staker_info1 = mock_info("addr1", &[Coin::new(100000000u128, "WattPeak")]);
        let staker_info2 = mock_info("addr2", &[Coin::new(200000000u128, "WattPeak")]);
        let staker_info3 = mock_info("addr3", &[Coin::new(300000000u128, "WattPeak")]);

        execute(
            deps.as_mut(),
            env.clone(),
            staker_info1.clone(),
            ExecuteMsg::Stake {},
        )
        .unwrap();

        execute(
            deps.as_mut(),
            env.clone(),
            staker_info2.clone(),
            ExecuteMsg::Stake {},
        )
        .unwrap();

        execute(
            deps.as_mut(),
            env.clone(),
            staker_info3.clone(),
            ExecuteMsg::Stake {},
        )
        .unwrap();

        calculate_interest_after_epoch(deps.as_mut()).unwrap();
        calculate_interest_after_epoch(deps.as_mut()).unwrap();
        calculate_interest_after_epoch(deps.as_mut()).unwrap();

        let updated_staker1 = STAKERS
            .load(&deps.storage, staker_info1.sender)
            .unwrap();
        let updated_staker2 = STAKERS
            .load(&deps.storage, staker_info2.sender)
            .unwrap();
        let updated_staker3 = STAKERS
            .load(&deps.storage, staker_info3.sender)
            .unwrap();
        let total_interest = TOTAL_INTEREST_WATTPEAK.load(&deps.storage);
        assert_eq!(
            total_interest.unwrap(),
            Decimal::from_ratio(16351402541553u128, 100000000u128)
        );
        assert_eq!(
            updated_staker1.interest_wattpeak,
            Decimal::from_ratio(81757012707765u128, 1000000000u128)
        );
        assert_eq!(
            updated_staker2.interest_wattpeak,
            Decimal::from_ratio(16351402541553u128, 100000000u128)
        );
        assert_eq!(
            updated_staker3.interest_wattpeak,
            Decimal::from_ratio(245271038123295u128, 1000000000u128)
        );

    }
}
