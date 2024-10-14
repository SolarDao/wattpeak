use std::str::FromStr;

use crate::state::{CONFIG, EPOCH_COUNT, PERCENTAGE_OF_YEAR, STAKERS, TOTAL_INTEREST_WATTPEAK};
use cosmwasm_std::{Decimal, DepsMut, Env, MessageInfo, Order, Response, StdError, StdResult, Uint128};

pub fn set_yearly_percentage(deps: DepsMut, epoch_length: u64) -> StdResult<()> {
    let time_staked = Decimal::from_ratio(epoch_length, 1u64);
    let one_year = Decimal::from_ratio(31556926u64, 1u64);
    let percentage_of_year = time_staked.checked_div(one_year).unwrap();
    PERCENTAGE_OF_YEAR.save(deps.storage, &percentage_of_year)?;
    Ok(())
}

pub fn calculate_interest_after_epoch(deps: DepsMut, info: MessageInfo) -> StdResult<Response> {
    if info.sender != CONFIG.load(deps.storage)?.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }

    let mut total_interest_wattpeak = TOTAL_INTEREST_WATTPEAK.may_load(deps.storage)?.unwrap_or_else(Decimal::zero);
  
    let stakers = STAKERS
        .range(deps.storage, None, None, Order::Ascending)
        .collect::<StdResult<Vec<_>>>()?;
    
    // Load or initialize total wattpeak interest earned during period
    let mut total_wattpeak_interest_earned_during_period = Decimal::zero();
    
    // Load percentage of year
    let percentage_of_year = PERCENTAGE_OF_YEAR.load(deps.storage)?;
    
    // Load interest rate from config
    let interest_rate = CONFIG.load(deps.storage)?.rewards_percentage;

    for (key, mut staker) in stakers {
        let wattpeak_staked = Decimal::from_ratio(staker.wattpeak_staked, 1u64);
        let wattpeak_interest_per_year = wattpeak_staked.checked_mul(interest_rate).unwrap();
        let wattpeak_interest_earned = wattpeak_interest_per_year.checked_mul(percentage_of_year).unwrap();

        total_wattpeak_interest_earned_during_period = total_wattpeak_interest_earned_during_period
            .checked_add(wattpeak_interest_earned).unwrap();
        
        staker.interest_wattpeak = staker
            .interest_wattpeak
            .checked_add(wattpeak_interest_earned).unwrap();
        
        // Save the updated staker information
        STAKERS.save(deps.storage, key, &staker)?;
    }
    
    // Update total interest wattpeak
    total_interest_wattpeak = total_interest_wattpeak
        .checked_add(total_wattpeak_interest_earned_during_period).unwrap();
    
    // Save updated total interest wattpeak
    TOTAL_INTEREST_WATTPEAK.save(deps.storage, &total_interest_wattpeak)?;
    
    // Increment epoch count
    EPOCH_COUNT.update(deps.storage, |count| -> StdResult<_> { Ok(count + 1) })?;

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

    use super::*;
    use crate::execute::execute;
    use crate::{
        instantiate,
        msg::{ExecuteMsg, InstantiateMsg},
        state::Config,
    };
    use cosmwasm_std::{testing::mock_info, Coin, Decimal};
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
            epoch_length: 86000,
            wattpeak_denom: "watt".to_string(),
            staking_fee_address: Addr::unchecked("staking_fee_address"),
            staking_fee_percentage: Decimal::percent(5),
        };
        CONFIG.save(&mut deps.storage, &config).unwrap();

        let env = mock_env();
        let info = mock_info("admin", &[]);
        let msg = InstantiateMsg { config };
        let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let staker_info1 = mock_info(
            "addr1",
            &[Coin::new(
                100000000u128,
                "watt",
            )],
        );
        let staker_info2 = mock_info(
            "addr2",
            &[Coin::new(
                200000000u128,
                "watt",
            )],
        );
        let staker_info3 = mock_info(
            "addr3",
            &[Coin::new(
                300000000u128,
                "watt",
            )],
        );

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

        calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();

        let updated_staker1 = STAKERS.load(&deps.storage, staker_info1.sender).unwrap();
        let updated_staker2 = STAKERS.load(&deps.storage, staker_info2.sender).unwrap();
        let updated_staker3 = STAKERS.load(&deps.storage, staker_info3.sender).unwrap();

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
        assert_eq!(EPOCH_COUNT.load(&deps.storage).unwrap(), 1)
    }
    #[test]
    fn multiple_epoch_calculation() {
        let mut deps = mock_dependencies();

        let config = Config {
            admin: Addr::unchecked("admin"),          // Example admin address
            rewards_percentage: Decimal::percent(10), // Example rewards percentage
            epoch_length: 86000,
            wattpeak_denom: "watt".to_string(),
            staking_fee_address: Addr::unchecked("staking_fee_address"),
            staking_fee_percentage: Decimal::percent(5),               // Example epoch length
        };
        CONFIG.save(&mut deps.storage, &config).unwrap();

        let env = mock_env();
        let info = mock_info("admin", &[]);
        let msg = InstantiateMsg { config };
        let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let staker_info1 = mock_info(
            "addr1",
            &[Coin::new(
                100000000u128,
                "watt",
            )],
        );
        let staker_info2 = mock_info(
            "addr2",
            &[Coin::new(
                200000000u128,
                "watt",
            )],
        );
        let staker_info3 = mock_info(
            "addr3",
            &[Coin::new(
                300000000u128,
                "watt",
            )],
        );

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

        calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();
        calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();
        calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();

        let updated_staker1 = STAKERS.load(&deps.storage, staker_info1.sender).unwrap();
        let updated_staker2 = STAKERS.load(&deps.storage, staker_info2.sender).unwrap();
        let updated_staker3 = STAKERS.load(&deps.storage, staker_info3.sender).unwrap();
        let total_interest = TOTAL_INTEREST_WATTPEAK.load(&deps.storage);
        assert_eq!(
            total_interest.unwrap(),
            Decimal::from_ratio(49054207624659u128, 100000000u128)
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
        assert_eq!(EPOCH_COUNT.load(&deps.storage).unwrap(), 3)
    }
    #[test]
    fn unauthorized_new_epoch() {
        let mut deps = mock_dependencies();

        let config = Config {
            admin: Addr::unchecked("admin"),          // Example admin address
            rewards_percentage: Decimal::percent(10), // Example rewards percentage
            epoch_length: 86000, 
            wattpeak_denom: "watt".to_string(),
            staking_fee_address: Addr::unchecked("staking_fee_address"),
            staking_fee_percentage: Decimal::percent(5),                     // Example epoch length
        };
        CONFIG.save(&mut deps.storage, &config).unwrap();

        let env = mock_env();
        let info = mock_info("admin", &[]);
        let msg = InstantiateMsg { config };
        let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

        let staker_info1 = mock_info(
            "addr1",
            &[Coin::new(
                100000000u128,
                "watt",
            )],
        );
        let staker_info2 = mock_info(
            "addr2",
            &[Coin::new(
                200000000u128,
                "watt",
            )],
        );
        let staker_info3 = mock_info(
            "addr3",
            &[Coin::new(
                300000000u128,
                "watt",
            )],
        );

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

        let unauthorized_info = mock_info("addr1", &[]);
        let res = calculate_interest_after_epoch(deps.as_mut(), unauthorized_info.clone());
        assert_eq!(res.unwrap_err().to_string(), "Generic error: Unauthorized");
    }
}
