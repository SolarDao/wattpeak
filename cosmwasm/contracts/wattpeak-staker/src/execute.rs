use cosmwasm_std::{
    entry_point, Addr, BankMsg, Coin, Decimal, DepsMut, Env, MessageInfo, Response, StdError,
    StdResult, Uint128,
};

use crate::{
    helpers::{
        calculate_interest_after_epoch, calculate_staker_share_of_reward, set_yearly_percentage,
    },
    msg::ExecuteMsg,
    state::{Staker, CONFIG, STAKERS, TOTAL_WATTPEAK_STAKED},
};

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::UpdateConfig {
            admin,
            rewards_percentage,
            epoch_length,
        } => update_config(deps, env, info, admin, epoch_length, rewards_percentage),
        ExecuteMsg::Stake {} => stake_wattpeak(deps, env, info),
        ExecuteMsg::Unstake { amount } => unstake_wattpeak(deps, env, info, amount),
        ExecuteMsg::DepositRewards {} => deposit_rewards(deps, env, info),
        ExecuteMsg::ClaimReward {} => claim_rewards(deps, env, info),
        ExecuteMsg::NewEpoch {} => calculate_interest_after_epoch(deps, info),
    }
}

fn update_config(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    admin: Option<String>,
    epoch_length: Option<u64>,
    rewards_percentage: Option<Decimal>,
) -> StdResult<Response> {
    // Check if the sender is the admin
    let mut config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }

    // Update the admin address if it was provided
    if let Some(admin) = admin {
        config.admin = Addr::unchecked(admin);
    }

    // Update the rewards percentage if it was provided
    if let Some(rewards_percentage) = rewards_percentage {
        config.rewards_percentage = rewards_percentage;
    }

    // Update the epoch length if it was provided
    if let Some(epoch_length) = epoch_length {
        config.epoch_length = epoch_length;
    }

    // Validate the updated configuration
    config.validate(deps.as_ref())?;

    // Save the updated configuration
    CONFIG.save(deps.storage, &config)?;

    // If the epoch length was updated, update the yearly percentage
    if let Some(epoch_length) = epoch_length {
        set_yearly_percentage(deps, epoch_length)?;
    }

    Ok(Response::new().add_attribute("action", "update_config"))
}

fn stake_wattpeak(deps: DepsMut, env: Env, info: MessageInfo) -> StdResult<Response> {
    let staker_address = &info.sender;
    let config = CONFIG.load(deps.storage)?;

    let amount = info
        .funds
        .iter()
        //Change to correct contract address when minter is deployed
        .find(|coin| coin.denom == config.wattpeak_denom)
        .map(|coin| coin.amount)
        .unwrap_or_else(Uint128::zero);
    // Verify the correct amount of tokens was sent to the contract
    //Change to correct contract address when minter is deployed
    if !info
        .funds
        .iter()
        .any(|coin| coin.denom == config.wattpeak_denom)
    {
        return Err(StdError::generic_err(
            "Must stake WattPeak tokens to the contract",
        ));
    }

    if !info.funds.iter().all(|coin| coin.amount > Uint128::zero()) {
        return Err(StdError::generic_err("Stake amount can't be zero"));
    }

    // Check if the staker already exists
    let mut staker = STAKERS.may_load(deps.storage, staker_address.clone())?;

    match staker {
        Some(ref mut s) => {
            // If the staker exists, update their staked wattpeak
            s.wattpeak_staked += amount;
        }
        None => {
            // If the staker does not exist, create a new record
            staker = Some(Staker {
                wattpeak_staked: amount,
                interest_wattpeak: Decimal::zero(),
                stake_start_time: env.block.time.seconds(),
                claimable_rewards: Decimal::zero(),
            });
        }
    }

    // Save the updated or new staker record
    STAKERS.save(deps.storage, staker_address.clone(), &staker.unwrap())?;

    // Update the total wattpeak staked in the contract
    TOTAL_WATTPEAK_STAKED.update(deps.storage, |total| -> StdResult<_> { Ok(total + amount) })?;

    // Construct the response
    Ok(Response::new()
        .add_attribute("action", "stake_wattpeak")
        .add_attribute("from", info.sender.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn deposit_rewards(deps: DepsMut, env: Env, info: MessageInfo) -> StdResult<Response> {
    let wattpeak_denom = CONFIG.load(deps.storage)?.wattpeak_denom;

    let amount = info
        .funds
        .iter()
        //Change to correct contract address when minter is deployed
        .find(|coin| coin.denom == wattpeak_denom)
        .map(|coin| coin.amount)
        .unwrap_or_else(Uint128::zero);

    // Check if the sender is the admin
    if info.sender != CONFIG.load(deps.storage)?.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }
    //Change to correct contract address when minter is deployed
    if !info.funds.iter().any(|coin| coin.denom == wattpeak_denom) {
        return Err(StdError::generic_err(
            "Must deposit WattPeak tokens to the contract",
        ));
    }

    if !info.funds.iter().all(|coin| coin.amount > Uint128::zero()) {
        return Err(StdError::generic_err("Deposit amount can't be zero"));
    }
    // Calculate the share of rewards for each staker
    calculate_staker_share_of_reward(deps, env, amount)
        .map_err(|e| StdError::generic_err(format!("Failed to calculate staker shares: {}", e)))?;

    Ok(Response::new()
        .add_attribute("method", "deposit_rewards")
        .add_attribute("from", info.sender.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn unstake_wattpeak(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> StdResult<Response> {
    if amount == Uint128::zero() {
        return Err(StdError::generic_err("Unstake amount can't be zero"));
    }

    let staker_address = &info.sender;
    let wattpeak_denom = CONFIG.load(deps.storage)?.wattpeak_denom;

    let mut staker = STAKERS
        .load(deps.storage, staker_address.clone())
        .map_err(|_| StdError::generic_err("Staker does not exist"))?;

    // Check if the staker has enough wattpeak staked
    if staker.wattpeak_staked < amount {
        return Err(StdError::generic_err("Insufficient staked wattpeak"));
    }

    staker.wattpeak_staked -= amount;

    // Save the updated staker record
    STAKERS.save(deps.storage, staker_address.clone(), &staker)?;

    // Update the total wattpeak staked in the contract
    TOTAL_WATTPEAK_STAKED.update(deps.storage, |total| -> StdResult<_> { Ok(total - amount) })?;

    // Create a bank message to send tokens to the staker's address
    let payment_msg = BankMsg::Send {
        to_address: staker_address.to_string(),
        amount: vec![Coin {
            //Change to correct contract address when minter is deployed
            denom: wattpeak_denom,
            amount: amount,
        }],
    };

    if staker.wattpeak_staked.is_zero()
        && staker.claimable_rewards.is_zero()
        && staker.interest_wattpeak.is_zero()
    {
        STAKERS.remove(deps.storage, staker_address.clone());
    }

    // Construct the response
    Ok(Response::new()
        .add_message(payment_msg)
        .add_attribute("action", "unstake")
        .add_attribute("from", info.sender.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn claim_rewards(deps: DepsMut, _env: Env, info: MessageInfo) -> StdResult<Response> {
    let staker_address = &info.sender;

    // Check if the staker exists
    let mut staker = STAKERS.load(deps.storage, staker_address.clone())?;
    if staker.claimable_rewards.is_zero() {
        return Err(StdError::generic_err("No rewards to claim"));
    }
    let rewards = staker.claimable_rewards;

    let staking_fee = CONFIG.load(deps.storage)?.staking_fee_percentage;

    let staking_fee = rewards.checked_mul(staking_fee).unwrap();

    let reward_payment = rewards.checked_sub(staking_fee).unwrap();

    let reward_denom = CONFIG.load(deps.storage)?.wattpeak_denom;

    // Convert the rewards from Decimal to Uint128
    let rewards_amount = if let Some(amount) = reward_payment.to_string().parse::<f64>().ok() {
        Uint128::from(amount as u128) // safely truncating the decimal part
    } else {
        return Err(StdError::generic_err("Failed to parse rewards amount"));
    };

    // Convert the rewards from Decimal to Uint128
    let staking_fee_amount = if let Some(amount) = staking_fee.to_string().parse::<f64>().ok() {
        Uint128::from(amount as u128) // safely truncating the decimal part
    } else {
        return Err(StdError::generic_err("Failed to parse rewards amount"));
    };

    // Create a bank message to send tokens to the staker's address
    let payment_msg = BankMsg::Send {
        to_address: staker_address.to_string(),
        amount: vec![Coin {
            //Change to correct contract address when minter is deployed
            denom: reward_denom.clone(),
            amount: rewards_amount,
        }],
    };

    let staking_fee_msg = BankMsg::Send {
        to_address: CONFIG.load(deps.storage)?.staking_fee_address.to_string(),
        amount: vec![Coin {
            //Change to correct contract address when minter is deployed
            denom: reward_denom.clone(),
            amount: staking_fee_amount,
        }],
    };

    // Update the staker's claimable rewards
    staker.claimable_rewards = Decimal::zero();

    // Save the updated staker record
    STAKERS.save(deps.storage, staker_address.clone(), &staker)?;

    if staker.wattpeak_staked.is_zero()
        && staker.claimable_rewards.is_zero()
        && staker.interest_wattpeak.is_zero()
    {
        STAKERS.remove(deps.storage, staker_address.clone());
    }

    // Construct the response
    Ok(Response::new()
        .add_message(payment_msg)
        .add_message(staking_fee_msg)
        .add_attribute("action", "claim_rewards")
        .add_attribute("from", info.sender.to_string())
        .add_attribute("amount", rewards.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    mod update_config {
        use cosmwasm_std::{
            testing::{mock_dependencies, mock_env, mock_info},
            Addr, Decimal,
        };

        use crate::execute::execute;
        use crate::msg::ExecuteMsg;
        use crate::{instantiate, msg::InstantiateMsg, state::Config};

        use super::CONFIG;

        #[test]
        fn proper_update_config() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
            let msg = ExecuteMsg::UpdateConfig {
                admin: Some("new_admin".to_string()),
                rewards_percentage: Some(Decimal::percent(5)),
                epoch_length: Some(86400),
            };
            execute(deps.as_mut(), env.clone(), info, msg).unwrap();
            CONFIG
                .save(
                    deps.as_mut().storage,
                    &Config {
                        admin: Addr::unchecked("admin"),
                        rewards_percentage: Decimal::percent(10),
                        epoch_length: 86400,
                        wattpeak_denom: "watt".to_string(),
                        staking_fee_address: Addr::unchecked("staking_fee_address"),
                        staking_fee_percentage: Decimal::percent(5),
                    },
                )
                .unwrap();
            let updated_config = CONFIG.load(deps.as_ref().storage).unwrap();
            assert_eq!(updated_config.admin, Addr::unchecked("admin"));
        }
        #[test]
        fn unauthorized_update_config() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
            let msg = ExecuteMsg::UpdateConfig {
                admin: Some("new_admin".to_string()),
                rewards_percentage: Some(Decimal::percent(5)),
                epoch_length: Some(86400),
            };
            let res = execute(deps.as_mut(), env.clone(), mock_info("random", &[]), msg);
            assert_eq!(res.unwrap_err().to_string(), "Generic error: Unauthorized");
        }
        #[test]
        fn validate_config_epoch() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
            let msg = ExecuteMsg::UpdateConfig {
                admin: Some("new_admin".to_string()),
                rewards_percentage: Some(Decimal::percent(5)),
                epoch_length: Some(0),
            };
            let res = execute(deps.as_mut(), env.clone(), info, msg);
            assert_eq!(
                res.unwrap_err().to_string(),
                "Generic error: epoch_length cannot be zero"
            );
        }
        #[test]
        fn validate_config_rewards_percentage() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
            let msg = ExecuteMsg::UpdateConfig {
                admin: Some("new_admin".to_string()),
                rewards_percentage: Some(Decimal::percent(101)),
                epoch_length: Some(86400),
            };
            let res = execute(deps.as_mut(), env.clone(), info, msg);
            assert_eq!(
                res.unwrap_err().to_string(),
                "Generic error: rewards_percentage cannot be greater than 100%"
            );
        }
    }
    mod staking_tests {
        use super::*;
        use crate::{instantiate, msg::InstantiateMsg, state::Config};
        use cosmwasm_std::{
            testing::{mock_dependencies, mock_env, mock_info},
            Addr, Coin, Decimal, Uint128,
        };

        #[test]
        fn stake_wattpeak() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(100u128, "watt")]);

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 0);

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info.sender)
                .unwrap();
            assert_eq!(staker.wattpeak_staked, Uint128::from(100u128));

            let total_wattpeak: Uint128 =
                TOTAL_WATTPEAK_STAKED.load(deps.as_ref().storage).unwrap();
            assert_eq!(total_wattpeak, Uint128::from(100u128));
        }

        #[test]
        fn stake_wattpeak_existing_staker() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(10),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[Coin::new(100u128, "watt")]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(100u128, "watt")]);

            let _res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake {},
            )
            .unwrap();

            let staker_info2 = mock_info("staker", &[Coin::new(100u128, "watt")]);

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info2,
                ExecuteMsg::Stake {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 0);

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info.sender)
                .unwrap();
            assert_eq!(staker.wattpeak_staked, Uint128::from(200u128));

            let total_wattpeak: Uint128 =
                TOTAL_WATTPEAK_STAKED.load(deps.as_ref().storage).unwrap();
            assert_eq!(total_wattpeak, Uint128::from(200u128));
        }
        #[test]
        fn stake_zero_amount() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(10),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[Coin::new(100u128, "watt")]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(0u128, "watt")]);

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake {},
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: Stake amount can't be zero"
            );
        }
        #[test]
        fn stake_incorrect_denom() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(10),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[Coin::new(100u128, "watt")]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(100u128, "random")]);

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake {},
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: Must stake WattPeak tokens to the contract"
            );
        }
    }

    mod unstake_test {
        use super::*;
        use crate::{instantiate, msg::InstantiateMsg, state::Config};
        use cosmwasm_std::{
            testing::{mock_dependencies, mock_env, mock_info},
            Addr, BankMsg, Coin, CosmosMsg, Decimal, Uint128,
        };

        #[test]
        fn unstake_wattpeak() {
            let mut deps = mock_dependencies();
            let env = mock_env();
            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(100u128, "watt")]);

            let _res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake {},
            )
            .unwrap();
            let amount = Uint128::from(50u128);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Unstake { amount },
            )
            .unwrap();

            assert_eq!(res.messages.len(), 1);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info.sender.to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount,
                    }],
                })
            );

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info.sender)
                .unwrap();
            assert_eq!(staker.wattpeak_staked, Uint128::from(50u128));

            let total_wattpeak: Uint128 =
                TOTAL_WATTPEAK_STAKED.load(deps.as_ref().storage).unwrap();
            assert_eq!(total_wattpeak, Uint128::from(50u128));
        }
        #[test]
        fn unstake_insufficient_stake() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(100u128, "watt")]);

            let _res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake {},
            )
            .unwrap();

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Unstake {
                    amount: Uint128::from(200u128),
                },
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: Insufficient staked wattpeak"
            );
        }
        #[test]
        fn unstake_staker_doesnt_exist() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[]);
            let amount = Uint128::from(100u128);

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Unstake { amount },
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: Staker does not exist"
            );
        }
        #[test]
        fn unstake_amount_is_zero() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(0u128, "watt")]);

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Unstake {
                    amount: Uint128::zero(),
                },
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: Unstake amount can't be zero"
            );
        }
        #[test]
        fn remove_staker() {
            let mut deps = mock_dependencies();
            let env = mock_env();
            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[Coin::new(100u128, "watt")]);

            let _res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake {},
            )
            .unwrap();
            let amount = Uint128::from(100u128);
            let _res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Unstake { amount },
            )
            .unwrap();

            let staker = STAKERS
                .may_load(deps.as_ref().storage, staker_info.sender.clone())
                .unwrap();
            assert_eq!(staker, None);
        }
    }
    mod deposit_rewards_tests {
        use super::*;
        use crate::{instantiate, msg::InstantiateMsg, state::Config};
        use cosmwasm_std::{
            testing::{mock_dependencies, mock_env, mock_info},
            Addr, Coin, Decimal, Uint128,
        };

        #[test]
        fn deposit_rewards() {}
        #[test]
        fn deposit_rewards_unauthorized() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[Coin::new(100u128, "watt")]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

            let deposit_amount = Uint128::from(574u128);
            let funds = Coin {
                denom: "watt".to_string(),
                amount: deposit_amount,
            };
            let info = mock_info("random", &[funds]);

            let res = execute(
                deps.as_mut(),
                env.clone(),
                info.clone(),
                ExecuteMsg::DepositRewards {},
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: Unauthorized"
            );
        }

        #[test]
        fn deposit_rewards_zero_amount() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[Coin::new(0u128, "watt")]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

            let res = execute(
                deps.as_mut(),
                env.clone(),
                info.clone(),
                ExecuteMsg::DepositRewards {},
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: Deposit amount can't be zero"
            );
        }
    }

    mod claim_rewards_test {
        use super::*;
        use crate::{
            helpers::calculate_interest_after_epoch, instantiate, msg::InstantiateMsg,
            state::Config,
        };
        use cosmwasm_std::{
            testing::{mock_dependencies, mock_env, mock_info},
            Addr, BankMsg, Coin, CosmosMsg, Decimal, Uint128,
        };

        #[test]
        fn claim_rewards() {
            let mut deps = mock_dependencies();
            let mut env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

            let staker_info1 = mock_info("addr1", &[Coin::new(100u128, "watt")]);
            let staker_info2 = mock_info("addr2", &[Coin::new(200u128, "watt")]);
            let staker_info3 = mock_info("addr3", &[Coin::new(300u128, "watt")]);
            let deposit_amount = Uint128::from(574u128);

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

            env = mock_env();
            let funds = Coin {
                denom: "watt".to_string(),
                amount: deposit_amount,
            };

            let info = mock_info("admin", &[funds.clone()]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                info.clone(),
                ExecuteMsg::DepositRewards {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 0);

            let claimer = mock_info("addr1", &[]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                claimer.clone(),
                ExecuteMsg::ClaimReward {},
            )
            .unwrap();
            println!("{:?}", res);
            assert_eq!(res.messages.len(), 2);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info1.sender.to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(90u128),
                    }],
                })
            );
            assert_eq!(
                res.messages[1].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "staking_fee_address".to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(4u128),
                    }],
                })
            );

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info1.sender)
                .unwrap();
            assert_eq!(staker.claimable_rewards, Decimal::zero());
        }
        #[test]
        fn claim_rewards_multiple_epochs() {
            let mut deps = mock_dependencies();
            let mut env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

            let staker_info1 = mock_info("addr1", &[Coin::new(100u128, "watt")]);
            let staker_info2 = mock_info("addr2", &[Coin::new(200u128, "watt")]);
            let staker_info3 = mock_info("addr3", &[Coin::new(300u128, "watt")]);
            let deposit_amount = Uint128::from(574u128);

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
            calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();
            calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();

            env = mock_env();
            let funds = Coin {
                denom: "watt".to_string(),
                amount: deposit_amount,
            };

            let info = mock_info("admin", &[funds.clone()]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                info.clone(),
                ExecuteMsg::DepositRewards {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 0);

            let claimer = mock_info("addr1", &[]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                claimer.clone(),
                ExecuteMsg::ClaimReward {},
            )
            .unwrap();

            let claimer2 = mock_info("addr2", &[]);
            let res2 = execute(
                deps.as_mut(),
                env.clone(),
                claimer2.clone(),
                ExecuteMsg::ClaimReward {},
            )
            .unwrap();

            let claimer3 = mock_info("addr3", &[]);
            let res3 = execute(
                deps.as_mut(),
                env.clone(),
                claimer3.clone(),
                ExecuteMsg::ClaimReward {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 2);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info1.sender.to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(90u128),
                    }],
                })
            );
            assert_eq!(
                res.messages[1].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "staking_fee_address".to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(4u128),
                    }],
                })
            );

            assert_eq!(res2.messages.len(), 2);
            assert_eq!(
                res2.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info2.sender.to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(181u128),
                    }],
                })
            );
            assert_eq!(
                res2.messages[1].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "staking_fee_address".to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(9u128),
                    }],
                })
            );

            assert_eq!(res3.messages.len(), 2);
            assert_eq!(
                res3.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info3.sender.to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(272u128),
                    }],
                })
            );

            assert_eq!(
                res3.messages[1].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "staking_fee_address".to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(14u128),
                    }],
                })
            );

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info1.sender)
                .unwrap();
            assert_eq!(staker.claimable_rewards, Decimal::zero());
        }

        #[test]
        fn claim_when_staker_doesnt_exist() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let claimer = mock_info("addr1", &[]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                claimer.clone(),
                ExecuteMsg::ClaimReward {},
            );

            assert_eq!(
                res.err().unwrap().to_string(),
                "wattpeak_staker::state::Staker not found"
            );
        }
        #[test]
        fn try_to_claim_twice_in_a_row() {
            let mut deps = mock_dependencies();
            let mut env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 86400,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

            let staker_info1 = mock_info("addr1", &[Coin::new(100u128, "watt")]);
            let staker_info2 = mock_info("addr2", &[Coin::new(200u128, "watt")]);
            let staker_info3 = mock_info("addr3", &[Coin::new(300u128, "watt")]);
            let deposit_amount = Uint128::from(574u128);

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

            calculate_interest_after_epoch(deps.as_mut(), info).unwrap();

            env = mock_env();
            let funds = Coin {
                denom: "watt".to_string(),
                amount: deposit_amount,
            };

            let info = mock_info("admin", &[funds.clone()]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                info.clone(),
                ExecuteMsg::DepositRewards {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 0);

            let claimer = mock_info("addr1", &[]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                claimer.clone(),
                ExecuteMsg::ClaimReward {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 2);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info1.sender.to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(90u128),
                    }],
                })
            );

            assert_eq!(
                res.messages[1].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "staking_fee_address".to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(4u128),
                    }],
                })
            );

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info1.sender)
                .unwrap();
            assert_eq!(staker.claimable_rewards, Decimal::zero());

            let res = execute(
                deps.as_mut(),
                env.clone(),
                claimer.clone(),
                ExecuteMsg::ClaimReward {},
            );
            assert_eq!(
                res.err().unwrap().to_string(),
                "Generic error: No rewards to claim"
            );
        }
        #[test]
        fn one_staker_three_epochs_deposit_and_claim() {
            let mut deps = mock_dependencies();
            let mut env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                    epoch_length: 1,
                    wattpeak_denom: "watt".to_string(),
                    staking_fee_address: Addr::unchecked("staking_fee_address"),
                    staking_fee_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();

            let staker_info1 = mock_info("addr1", &[Coin::new(100u128, "watt")]);
            let deposit_amount = Uint128::from(5000000u128);

            execute(
                deps.as_mut(),
                env.clone(),
                staker_info1.clone(),
                ExecuteMsg::Stake {},
            )
            .unwrap();

            calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();
            calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();
            calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();
            calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();
            calculate_interest_after_epoch(deps.as_mut(), info.clone()).unwrap();

            env = mock_env();
            let funds = Coin {
                denom: "watt".to_string(),
                amount: deposit_amount,
            };

            let info = mock_info("admin", &[funds.clone()]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                info.clone(),
                ExecuteMsg::DepositRewards {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 0);

            let claimer = mock_info("addr1", &[]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                claimer.clone(),
                ExecuteMsg::ClaimReward {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 2);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info1.sender.to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(4750000u128),
                    }],
                })
            );
            assert_eq!(
                res.messages[1].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "staking_fee_address".to_string(),
                    amount: vec![Coin {
                        denom: "watt".to_string(),
                        amount: Uint128::from(250000u128),
                    }],
                })
            );
        }
    }
}
