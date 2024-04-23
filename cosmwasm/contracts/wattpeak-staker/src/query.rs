use cosmwasm_std::{
    entry_point, to_json_binary, Addr, Binary, Decimal, Deps, Env, Order, StdResult, Uint128,
};

use crate::{
    msg::{QueryMsg, StakersResponse},
    state::{
        Config, Staker, CONFIG, STAKERS, TOTAL_INTEREST_WATTPEAK,
        TOTAL_WATTPEAK_STAKED,
    },
};

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&query_config(deps)?),
        QueryMsg::Staker { address } => to_json_binary(&query_staker(deps, address)?),
        QueryMsg::Stakers {} => to_json_binary(&query_stakers(deps)?),
        QueryMsg::TotalWattpeakStaked {} => to_json_binary(&query_total_wattpeak_staked(deps)?),
        QueryMsg::TotalInterestWattpeak {} => to_json_binary(&query_total_interest_wattpeak(deps)?),
    }
}

fn query_config(deps: Deps) -> StdResult<Config> {
    let config = CONFIG.load(deps.storage)?;
    Ok(config)
}

fn query_staker(deps: Deps, address: String) -> StdResult<Staker> {
    let staker = STAKERS.load(deps.storage, Addr::unchecked(address))?;
    Ok(staker)
}

fn query_stakers(deps: Deps) -> StdResult<StakersResponse> {
    let stakers = STAKERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|item| {
            let (_, staker) = item?;
            Ok(staker)
        })
        .collect::<StdResult<Vec<Staker>>>()?;
    Ok(StakersResponse { stakers })
}

fn query_total_wattpeak_staked(deps: Deps) -> StdResult<Uint128> {
    let total_wattpeak_staked = TOTAL_WATTPEAK_STAKED.load(deps.storage)?;
    Ok(total_wattpeak_staked)
}

fn query_total_interest_wattpeak(deps: Deps) -> StdResult<Decimal> {
    let total_interest_wattpeak = TOTAL_INTEREST_WATTPEAK.load(deps.storage)?;
    Ok(total_interest_wattpeak)
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{
        instantiate,
        msg::InstantiateMsg,
        state::{Config, Staker, STAKERS},
    };
    use cosmwasm_std::{
        testing::{mock_dependencies, mock_env, mock_info},
        Addr, Decimal, Uint128,
    };

    #[test]
    fn test_query_config() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let info = mock_info("anyone", &[]);
        let msg = InstantiateMsg {
            config: Config {
                admin: Addr::unchecked("admin"),
                rewards_percentage: Decimal::percent(10),
                epoch_length: 86400,
            },
        };
        let _res = instantiate(deps.as_mut(), env, info, msg).unwrap();

        let res = query_config(deps.as_ref()).unwrap();
        assert_eq!(res.admin, Addr::unchecked("admin"));
        assert_eq!(res.rewards_percentage, Decimal::percent(10));
    }

    #[test]
    fn test_query_staker() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let info = mock_info("anyone", &[]);
        let msg = InstantiateMsg {
            config: Config {
                admin: Addr::unchecked("admin"),
                rewards_percentage: Decimal::percent(10),
                epoch_length: 86400,
            },
        };
        let _res = instantiate(deps.as_mut(), env, info, msg).unwrap();

        let staker = Staker {
            wattpeak_staked: Uint128::from(100u128),
            interest_wattpeak: Decimal::percent(5),
            stake_start_time: 1_600_000_000,
            claimable_rewards: Decimal::zero(),
        };
        STAKERS
            .save(deps.as_mut().storage, Addr::unchecked("addr0000"), &staker)
            .unwrap();

        let res = query_staker(deps.as_ref(), "addr0000".to_string()).unwrap();
        assert_eq!(res, staker);
    }

    #[test]
    fn test_query_stakers() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let info = mock_info("anyone", &[]);
        let msg = InstantiateMsg {
            config: Config {
                admin: Addr::unchecked("admin"),
                rewards_percentage: Decimal::percent(10),
                epoch_length: 86400,
            },
        };
        let _res = instantiate(deps.as_mut(), env, info, msg).unwrap();

        let staker1 = Staker {
            wattpeak_staked: Uint128::from(100u128),
            interest_wattpeak: Decimal::zero(),
            stake_start_time: 1_600_000_000,
            claimable_rewards: Decimal::zero(),
        };
        let staker2 = Staker {
            wattpeak_staked: Uint128::from(200u128),
            interest_wattpeak: Decimal::zero(),
            stake_start_time: 1_600_000_000,
            claimable_rewards: Decimal::zero(),
        };
        STAKERS
            .save(deps.as_mut().storage, Addr::unchecked("addr0000"), &staker1)
            .unwrap();
        STAKERS
            .save(deps.as_mut().storage, Addr::unchecked("addr0001"), &staker2)
            .unwrap();

        let res = query_stakers(deps.as_ref()).unwrap();
        assert_eq!(res.stakers.len(), 2);
        assert_eq!(res.stakers[0], staker1);
        assert_eq!(res.stakers[1], staker2);
    }
    #[test]
    fn test_query_total_wattpeak_staked() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let info = mock_info("anyone", &[]);
        let msg = InstantiateMsg {
            config: Config {
                admin: Addr::unchecked("admin"),
                rewards_percentage: Decimal::percent(10),
                epoch_length: 86400,
            },
        };
        let _res = instantiate(deps.as_mut(), env, info, msg).unwrap();

        let res = query_total_wattpeak_staked(deps.as_ref()).unwrap();
        assert_eq!(res, Uint128::zero());
    }
    #[test]
    fn test_query_total_interest_wattpeak() {
        let mut deps = mock_dependencies();
        let env = mock_env();
        let info = mock_info("anyone", &[]);
        let msg = InstantiateMsg {
            config: Config {
                admin: Addr::unchecked("admin"),
                rewards_percentage: Decimal::percent(10),
                epoch_length: 86400,
            },
        };
        let _res = instantiate(deps.as_mut(), env, info, msg).unwrap();
        let total_interest_wattpeak = Decimal::new(Uint128::from(1000u128));
        TOTAL_INTEREST_WATTPEAK
            .save(deps.as_mut().storage, &total_interest_wattpeak)
            .unwrap();

        let res = query_total_interest_wattpeak(deps.as_ref()).unwrap();
        assert_eq!(res, total_interest_wattpeak);
    }
}
