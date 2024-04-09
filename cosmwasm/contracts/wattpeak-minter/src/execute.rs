use crate::helpers::mint_tokens_msg;
use crate::state::{
    Config, Project, AVAILABLE_WATTPEAK_COUNT, CONFIG, PROJECTS, PROJECT_DEALS_COUNT,
};
use crate::{error::ContractError, msg::ExecuteMsg};
use cosmwasm_std::{
    entry_point, Addr, Coin, Decimal, DepsMut, Env, MessageInfo, Response, StdResult,
};

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::UploadProject {
            name,
            description,
            document_deal_link,
            max_wattpeak,
        } => upload_project(
            deps,
            info,
            name,
            description,
            document_deal_link,
            max_wattpeak,
        ),
        ExecuteMsg::UpdateConfig {
            admin,
            minting_price,
            minting_payment_address,
            minting_fee_percentage,
            minting_fee_address,
        } => update_config(
            deps,
            info,
            admin,
            minting_price,
            minting_payment_address,
            minting_fee_percentage,
            minting_fee_address,
        ),
        ExecuteMsg::MintTokens {
            address,
            denom,
            amount,
        } => mint_tokens_msg(deps, info, address, denom, amount),
    }
}

pub fn upload_project(
    deps: DepsMut,
    info: MessageInfo,
    name: String,
    description: String,
    document_deal_link: String,
    max_wattpeak: u64,
) -> Result<Response, ContractError> {
    // Only admin can upload a new project
    let config = CONFIG.load(deps.as_ref().storage).unwrap();
    if config.admin != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    // Check if the project is valid
    if max_wattpeak == 0 {
        return Err(ContractError::InvalidMaxWattpeak {});
    }

    let id = PROJECT_DEALS_COUNT.update(deps.storage, |id| StdResult::Ok(id + 1))?;
    let project = Project {
        name,
        description,
        document_deal_link,
        max_wattpeak,
        minted_wattpeak_count: 0,
    };
    PROJECTS.save(deps.storage, id, &project)?;

    AVAILABLE_WATTPEAK_COUNT.update(deps.storage, |available_wattpeak_count| {
        StdResult::Ok(available_wattpeak_count + project.max_wattpeak)
    })?;

    Ok(Response::new()
        .add_attribute("action", "upload_project")
        .add_attribute("project_id", id.to_string())
        .add_attribute("new_wattpeak", project.max_wattpeak.to_string()))
}

pub fn update_config(
    deps: DepsMut,
    info: MessageInfo,
    admin: Addr,
    minting_price: Coin,
    minting_payment_address: Addr,
    minting_fee_percentage: Decimal,
    minting_fee_address: Addr,
) -> Result<Response, ContractError> {
    // Only admin can update the contract configuration
    let config = CONFIG.load(deps.as_ref().storage)?;
    if config.admin != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    let new_config = Config {
        admin,
        minting_price,
        minting_payment_address,
        minting_fee_percentage,
        minting_fee_address,
    };

    new_config.validate(deps.as_ref())?;

    CONFIG.save(deps.storage, &new_config)?;

    Ok(Response::new())
}

#[cfg(test)]
mod tests {
    use crate::state::Config;
    use cosmwasm_std::{coin, Addr, Decimal};

    const MOCK_ADMIN: &str = "admin";
    fn mock_config() -> Config {
        Config {
            admin: Addr::unchecked(MOCK_ADMIN),
            minting_payment_address: Addr::unchecked("mock_address_1"),
            minting_fee_percentage: Decimal::percent(5),
            minting_price: coin(1, "umpwr"),
            minting_fee_address: Addr::unchecked("mock_address_2"),
        }
    }

    mod upload_project_tests {
        use crate::error::ContractError;
        use crate::execute::execute;
        use crate::execute::tests::{mock_config, MOCK_ADMIN};
        use crate::msg::InstantiateMsg;
        use crate::state::{PROJECTS, PROJECT_DEALS_COUNT};
        use crate::{instantiate, state};
        use cosmwasm_std::coins;
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};

        #[test]
        fn test_upload_project() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            let msg = crate::msg::ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            let res = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            assert_eq!(res.attributes.len(), 3);
            assert_eq!(
                res.attributes[0],
                ("action".to_string(), "upload_project".to_string())
            );
            assert_eq!(
                res.attributes[1],
                ("project_id".to_string(), "1".to_string())
            );
            assert_eq!(
                res.attributes[2],
                ("new_wattpeak".to_string(), "1000".to_string())
            );

            let project_deals_count = PROJECT_DEALS_COUNT.load(deps.as_ref().storage).unwrap();
            assert_eq!(project_deals_count, 1);

            let project_deal = PROJECTS.load(deps.as_ref().storage, 1).unwrap();
            assert_eq!(project_deal.name, "test name");
            assert_eq!(project_deal.description, "test description");
            assert_eq!(project_deal.document_deal_link, "ipfs://test-link");
            assert_eq!(project_deal.max_wattpeak, 1000);
            assert_eq!(project_deal.minted_wattpeak_count, 0);

            let available_wattpeak_count = state::AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(available_wattpeak_count, 1000);

            let total_wattpeak_minted_count = state::TOTAL_WATTPEAK_MINTED_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(total_wattpeak_minted_count, 0);
        }

        #[test]
        fn invalid_upload_project() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            let msg = crate::msg::ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 0,
            };
            let err = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap_err();
            assert_eq!(err, ContractError::InvalidMaxWattpeak {});
        }

        #[test]
        fn test_upload_project_unauthorized() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            let msg = crate::msg::ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            let non_admin_info = mock_info("non_admin", &[]);
            let err = execute(deps.as_mut(), mock_env(), non_admin_info.clone(), msg).unwrap_err();
            assert_eq!(err, ContractError::Unauthorized {});
        }
    }
    mod update_config_tests {
        use crate::error::ContractError;
        use crate::execute::execute;
        use crate::execute::tests::{mock_config, MOCK_ADMIN};
        use crate::instantiate;
        use crate::msg::ExecuteMsg;
        use crate::state::CONFIG;
        use cosmwasm_std::coins;
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use cosmwasm_std::{Addr, Coin, Decimal, StdError};

        #[test]
        fn test_update_config() {
            let info = mock_info("admin", &[]);
            let mut deps = mock_dependencies();
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                crate::msg::InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            let new_admin = Addr::unchecked("new_admin");
            let new_minting_price: Coin = Coin::new(2, "new_WattPeak".to_string());
            let new_minting_payment_address = Addr::unchecked("new_minting_payment_address");
            let new_minting_fee_percentage = Decimal::percent(10);
            let new_minting_fee_address = Addr::unchecked("new_minting_fee_address");

            let msg = ExecuteMsg::UpdateConfig {
                admin: new_admin.clone(),
                minting_price: new_minting_price.clone(),
                minting_payment_address: new_minting_payment_address.clone(),
                minting_fee_percentage: new_minting_fee_percentage,
                minting_fee_address: new_minting_fee_address.clone(),
            };
            let res = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            assert_eq!(res.attributes.len(), 0);

            let config = CONFIG.load(deps.as_ref().storage).unwrap();
            assert_eq!(config.admin, new_admin);
            assert_eq!(config.minting_price, new_minting_price);
            assert_eq!(config.minting_payment_address, new_minting_payment_address);
            assert_eq!(config.minting_fee_percentage, new_minting_fee_percentage);
            assert_eq!(config.minting_fee_address, new_minting_fee_address);
        }

        #[test]
        fn test_update_config_unauthorized() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                crate::msg::InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            let msg = crate::msg::ExecuteMsg::UpdateConfig {
                admin: Addr::unchecked("new_admin"),
                minting_price: Coin::new(2, "WattPeak".to_string()),
                minting_payment_address: Addr::unchecked("new_minting_payment_address"),
                minting_fee_percentage: Decimal::percent(10),
                minting_fee_address: Addr::unchecked("new_minting_fee_address"),
            };
            let non_admin_info = mock_info("non_admin", &[]);
            let err = execute(deps.as_mut(), mock_env(), non_admin_info.clone(), msg).unwrap_err();
            assert_eq!(err, ContractError::Unauthorized {});
        }
        #[test]
        fn test_update_config_invalid_minting_price() {
            // Set up environment and existing config
            let info = mock_info(MOCK_ADMIN, &[]);
            let mut deps = mock_dependencies();
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                crate::msg::InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            // Define new configuration with an invalid minting price (zero amount)
            let invalid_minting_price: Coin = Coin::new(0, "WattPeak".to_string());
            let msg = crate::msg::ExecuteMsg::UpdateConfig {
                admin: Addr::unchecked("new_admin"),
                minting_price: invalid_minting_price.clone(),
                minting_payment_address: Addr::unchecked("new_minting_payment_address"),
                minting_fee_percentage: Decimal::percent(10),
                minting_fee_address: Addr::unchecked("new_minting_fee_address"),
            };

            // Call the update_config function and expect an error
            let err = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap_err();

            // Assert that the error is due to invalid minting price
            assert_eq!(
                err,
                ContractError::Std(StdError::generic_err("minting_price cannot be zero"))
            );
        }
        #[test]
        fn test_update_config_invalid_minting_price_denom() {
            // Set up environment and existing config
            let info = mock_info(MOCK_ADMIN, &[]);
            let mut deps = mock_dependencies();
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                crate::msg::InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            // Define new configuration with an invalid minting price (empty denom)
            let invalid_minting_price: Coin = Coin::new(1, "".to_string());
            let msg = crate::msg::ExecuteMsg::UpdateConfig {
                admin: Addr::unchecked("new_admin"),
                minting_price: invalid_minting_price.clone(),
                minting_payment_address: Addr::unchecked("new_minting_payment_address"),
                minting_fee_percentage: Decimal::percent(10),
                minting_fee_address: Addr::unchecked("new_minting_fee_address"),
            };

            // Call the update_config function and expect an error
            let err = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap_err();

            // Assert that the error is due to invalid minting price denom
            assert_eq!(
                err,
                ContractError::Std(StdError::generic_err("minting_price denom cannot be empty"))
            );
        }
        #[test]
        fn test_update_config_invalid_minting_fee_percentage() {
            // Set up environment and existing config
            let info = mock_info(MOCK_ADMIN, &[]);
            let mut deps = mock_dependencies();
            instantiate(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                crate::msg::InstantiateMsg {
                    config: mock_config(),
                },
            )
            .unwrap();

            // Define new configuration with an invalid minting fee percentage
            let invalid_minting_fee_percentage = Decimal::percent(101);
            let msg = crate::msg::ExecuteMsg::UpdateConfig {
                admin: Addr::unchecked("new_admin"),
                minting_price: Coin::new(1, "WattPeak".to_string()),
                minting_payment_address: Addr::unchecked("new_minting_payment_address"),
                minting_fee_percentage: invalid_minting_fee_percentage,
                minting_fee_address: Addr::unchecked("new_minting_fee_address"),
            };

            // Call the update_config function and expect an error
            let err = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap_err();

            // Assert that the error is due to invalid minting fee percentage
            assert_eq!(
                err,
                ContractError::Std(StdError::generic_err(
                    "minting_fee_percentage cannot be greater than 100%"
                ))
            );
        }
    }

    mod mint_tokens_tests {
        use crate::error::ContractError;
        use crate::execute::execute;
        use crate::execute::tests::{mock_config, MOCK_ADMIN};
        use crate::msg::ExecuteMsg;
        use crate::state::{AVAILABLE_WATTPEAK_COUNT, CONFIG, TOTAL_WATTPEAK_MINTED_COUNT};
        use crate::state::Config;
        use cosmwasm_std::coins;
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use cosmwasm_std::{Addr, Decimal, Uint128};

        #[test]
        fn test_mint_tokens() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            let config = mock_config();
            CONFIG.save(deps.as_mut().storage, &config).unwrap();
            AVAILABLE_WATTPEAK_COUNT.save(deps.as_mut().storage, &1000).unwrap();
            TOTAL_WATTPEAK_MINTED_COUNT.save(deps.as_mut().storage, &0).unwrap();

            let msg = crate::msg::ExecuteMsg::MintTokens {
                address: "address".to_string(),
                denom: "WattPeak".to_string(),
                amount: 100,
            };
            let res = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            assert_eq!(res.attributes.len(), 1);
            assert_eq!(res.attributes[0], ("action".to_string(), "mint_tokens".to_string()));

            let available_wattpeak_count = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(available_wattpeak_count, 900);

            let total_wattpeak_minted_count = TOTAL_WATTPEAK_MINTED_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(total_wattpeak_minted_count, 100);
        }

        #[test]
        fn test_mint_tokens_unauthorized() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            let config = mock_config();
            CONFIG.save(deps.as_mut().storage, &config).unwrap();
            AVAILABLE_WATTPEAK_COUNT.save(deps.as_mut().storage, &1000).unwrap();
            TOTAL_WATTPEAK_MINTED_COUNT.save(deps.as_mut().storage, &0).unwrap();

            let msg = crate::msg::ExecuteMsg::MintTokens {
                address: "address".to_string(),
                denom: "WattPeak".to_string(),
                amount: 100,
            };
            let non_admin_info = mock_info("non_admin", &[]);
            let err = execute(deps.as_mut(), mock_env(), non_admin_info.clone(), msg).unwrap_err();
            assert_eq!(err, ContractError::Unauthorized {});
        }
    }
}
