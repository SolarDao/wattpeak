use cosmwasm_std::{
    entry_point, Addr, BankMsg, Coin, Decimal, DepsMut, Env, MessageInfo, Response, StdError,
    StdResult, Uint128,
};

use crate::{
    helpers::calculate_staker_share_of_reward,
    msg::ExecuteMsg,
    state::{
        EpochState, Staker, CONFIG, EPOCH_STATE, STAKERS, TOTAL_REWARDS, TOTAL_WATTPEAK_STAKED,
    },
};

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    EpochState::check_update_epoch(&mut EPOCH_STATE.load(deps.storage)?, &env);

    match msg {
        ExecuteMsg::UpdateConfig {
            admin,
            rewards_percentage,
        } => update_config(deps, env, info, admin, rewards_percentage),
        ExecuteMsg::Stake { amount } => stake_wattpeak(deps, env, info, amount),
        ExecuteMsg::Unstake { amount } => unstake_wattpeak(deps, env, info, amount),
        ExecuteMsg::DepositRewards { amount } => deposit_rewards(deps, env, info, amount),
        ExecuteMsg::ClaimReward {} => claim_rewards(deps, env, info),
    }
}

fn update_config(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    admin: Option<String>,
    rewards_percentage: Option<Decimal>,
) -> StdResult<Response> {
    // Check if the sender is the admin
    if info.sender != CONFIG.load(deps.storage)?.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }

    // Update the admin address if it was provided
    if let Some(admin) = admin {
        CONFIG.update(deps.storage, |mut config| -> StdResult<_> {
            config.admin = Addr::unchecked(admin);
            Ok(config)
        })?;
    }

    // Update the rewards percentage if it was provided
    if let Some(rewards_percentage) = rewards_percentage {
        CONFIG.update(deps.storage, |mut config| -> StdResult<_> {
            config.rewards_percentage = rewards_percentage;
            Ok(config)
        })?;
    }

    Ok(Response::new().add_attribute("action", "update_config"))
}

fn stake_wattpeak(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> StdResult<Response> {
    let staker_address = &info.sender;

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
                address: staker_address.clone(),
                wattpeak_staked: amount,
                interest_wattpeak: Decimal::zero(),
                stake_start_time: env.block.time.seconds(),
                claimable_rewards: Decimal::zero(),
            });
        }
    }

    // Save the updated or new staker record
    STAKERS.save(deps.storage, staker_address.clone(), &staker.unwrap())?;

    TOTAL_WATTPEAK_STAKED.update(deps.storage, |total| -> StdResult<_> { Ok(total + amount) })?;

    // Create a bank message to send tokens to the contract's address
    let payment_msg = BankMsg::Send {
        to_address: env.contract.address.to_string(),
        amount: vec![Coin {
            denom: "WattPeak".to_string(),
            amount: amount,
        }],
    };

    // Construct the response
    Ok(Response::new()
        .add_message(payment_msg)
        .add_attribute("action", "stake")
        .add_attribute("from", info.sender.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn deposit_rewards(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> StdResult<Response> {
    // Check if the sender is the admin
    if info.sender != CONFIG.load(deps.storage)?.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }

    // Update the total rewards in the contract
    let contract_address = env.contract.address.clone();
    println!("Contract address: {:?}", contract_address);
    //TOTAL_REWARDS.update(deps.storage, |total| -> StdResult<_> { Ok(total + amount) })?;

    calculate_staker_share_of_reward(deps, env, amount)
        .map_err(|e| StdError::generic_err(format!("Failed to calculate staker shares: {}", e)))?;

    // Create a bank message to send tokens to the contract's address
    let payment_msg = BankMsg::Send {
        to_address: contract_address.to_string(),
        amount: vec![Coin {
            denom: "WattPeak".to_string(),
            amount: amount,
        }],
    };

    // Construct the response
    Ok(Response::new()
        .add_message(payment_msg)
        .add_attribute("action", "deposit_rewards")
        .add_attribute("from", info.sender.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn unstake_wattpeak(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> StdResult<Response> {
    let staker_address = &info.sender;

    // Check if the staker exists
    let mut staker = STAKERS.load(deps.storage, staker_address.clone())?;

    // Check if the staker has enough wattpeak staked
    if staker.wattpeak_staked < amount {
        return Err(StdError::generic_err("Insufficient staked wattpeak"));
    }

    // Update the staker's staked wattpeak
    staker.wattpeak_staked -= amount;

    // Save the updated staker record
    STAKERS.save(deps.storage, staker_address.clone(), &staker)?;

    // Update the total wattpeak staked in the contract
    TOTAL_WATTPEAK_STAKED.update(deps.storage, |total| -> StdResult<_> { Ok(total - amount) })?;

    // Create a bank message to send tokens to the staker's address
    let payment_msg = BankMsg::Send {
        to_address: staker_address.to_string(),
        amount: vec![Coin {
            denom: "WattPeak".to_string(),
            amount: amount,
        }],
    };

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

    // Calculate the rewards to be claimed
    let rewards = staker.claimable_rewards;
    println!("Rewards: {:?}", rewards);

    // Convert the rewards from Decimal to Uint128
    //let rewards_amount = Uint128::from(rewards.to_string().parse::<u128>().unwrap());
    // Convert the rewards from Decimal to Uint128 (safely handling the conversion)
    let rewards_amount = if let Some(amount) = rewards.to_string().parse::<f64>().ok() {
        Uint128::from(amount as u128) // safely truncating the decimal part
    } else {
        return Err(StdError::generic_err("Failed to parse rewards amount"));
    };

    // Create a bank message to send tokens to the staker's address
    let payment_msg = BankMsg::Send {
        to_address: staker_address.to_string(),
        amount: vec![Coin {
            denom: "WattPeak".to_string(),
            amount: rewards_amount,
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
                },
            };

            let info = mock_info("admin", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg).unwrap();
            let msg = ExecuteMsg::UpdateConfig {
                admin: Some("new_admin".to_string()),
                rewards_percentage: Some(Decimal::percent(5)),
            };
            execute(deps.as_mut(), env.clone(), info, msg).unwrap();
            CONFIG
                .save(
                    deps.as_mut().storage,
                    &Config {
                        admin: Addr::unchecked("admin"),
                        rewards_percentage: Decimal::percent(10),
                    },
                )
                .unwrap();
            let updated_config = CONFIG.load(deps.as_ref().storage).unwrap();
            assert_eq!(updated_config.admin, Addr::unchecked("admin"));
        }
    }
    mod staking_tests {
        use super::*;
        use crate::{instantiate, msg::InstantiateMsg, state::Config};
        use cosmwasm_std::{
            testing::{mock_dependencies, mock_env, mock_info},
            Addr, BankMsg, Coin, CosmosMsg, Decimal, Timestamp, Uint128,
        };

        #[test]
        fn stake_wattpeak() {
            let mut deps = mock_dependencies();
            let mut env = mock_env();
            env.block.time = Timestamp::from_seconds(1_600_000_000); // Example fixed time for testing

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
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
                ExecuteMsg::Stake { amount },
            )
            .unwrap();

            assert_eq!(res.messages.len(), 1);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: env.contract.address.to_string(),
                    amount: vec![Coin {
                        denom: "WattPeak".to_string(),
                        amount,
                    }],
                })
            );

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info.sender)
                .unwrap();
            assert_eq!(staker.wattpeak_staked, amount);

            let total_wattpeak: Uint128 =
                TOTAL_WATTPEAK_STAKED.load(deps.as_ref().storage).unwrap();
            assert_eq!(total_wattpeak, amount);
        }

        #[test]
        fn stake_wattpeak_existing_staker() {
            let mut deps = mock_dependencies();
            let env = mock_env();

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(10),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("staker", &[]);
            let amount = Uint128::from(100u128);

            let _res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake { amount },
            )
            .unwrap();

            let res = execute(
                deps.as_mut(),
                env.clone(),
                staker_info.clone(),
                ExecuteMsg::Stake { amount },
            )
            .unwrap();

            assert_eq!(res.messages.len(), 1);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: env.contract.address.to_string(),
                    amount: vec![Coin {
                        denom: "WattPeak".to_string(),
                        amount,
                    }],
                })
            );

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info.sender)
                .unwrap();
            assert_eq!(staker.wattpeak_staked, Uint128::from(200u128));

            let total_wattpeak: Uint128 =
                TOTAL_WATTPEAK_STAKED.load(deps.as_ref().storage).unwrap();
            assert_eq!(total_wattpeak, Uint128::from(200u128));
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
            Addr, BankMsg, Coin, CosmosMsg, Decimal, Timestamp, Uint128,
        };

        #[test]
        fn claim_rewards() {
            let mut deps = mock_dependencies();
            // Initialize environment with current block time
            let current_time = 1_600_000_000; // This should match your context's needs
            let mut env = mock_env();
            env.block.time = Timestamp::from_seconds(current_time);

            let msg = InstantiateMsg {
                config: Config {
                    admin: Addr::unchecked("admin"),
                    rewards_percentage: Decimal::percent(5),
                },
            };

            let info = mock_info("creator", &[]);
            let _res = instantiate(deps.as_mut(), env.clone(), info, msg).unwrap();

            let staker_info = mock_info("addr1", &[]);
            let deposit_amount = Uint128::from(574u128);

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

            env = mock_env();
            let funds = Coin {
                denom: "WattPeak".to_string(),
                amount: deposit_amount,
            };

            let info = mock_info("admin", &[funds.clone()]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                info.clone(),
                ExecuteMsg::DepositRewards {
                    amount: deposit_amount,
                },
            )
            .unwrap();

            assert_eq!(res.messages.len(), 1);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: env.contract.address.to_string(),
                    amount: vec![Coin {
                        denom: "WattPeak".to_string(),
                        amount: deposit_amount,
                    }],
                })
            );
            let claimer = mock_info("addr1", &[]);
            let res = execute(
                deps.as_mut(),
                env.clone(),
                claimer.clone(),
                ExecuteMsg::ClaimReward {},
            )
            .unwrap();

            assert_eq!(res.messages.len(), 1);
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: staker_info.sender.to_string(),
                    amount: vec![Coin {
                        denom: "WattPeak".to_string(),
                        amount: Uint128::from(54u128),
                    }],
                })
            );

            let staker = STAKERS
                .load(deps.as_ref().storage, staker_info.sender)
                .unwrap();
            assert_eq!(staker.claimable_rewards, Decimal::zero());
        }
    }
}
