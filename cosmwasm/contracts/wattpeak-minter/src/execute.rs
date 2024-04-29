use std::str::FromStr;

use crate::state::{
    Config, Project, AVAILABLE_WATTPEAK_COUNT, CONFIG, PROJECTS, PROJECT_DEALS_COUNT, SUBDENOM,
    TOTAL_WATTPEAK_MINTED_COUNT,
};
use crate::{error::ContractError, msg::ExecuteMsg};
use cosmwasm_std::{
    entry_point, Addr, BankMsg, Coin, CosmosMsg, Decimal, DepsMut, Env, MessageInfo, Response,
    StdResult, Uint128,
};
use token_bindings::TokenFactoryMsg;

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
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
        ExecuteMsg::EditProject {
            id,
            name,
            description,
            document_deal_link,
            max_wattpeak,
        } => edit_project(
            deps,
            info,
            id,
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
            amount,
            project_id,
        } => mint_tokens_msg(deps, info, address, amount, project_id),
    }
}

pub fn upload_project(
    deps: DepsMut,
    info: MessageInfo,
    name: String,
    description: String,
    document_deal_link: String,
    max_wattpeak: u64,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
    // Only admin can upload a new project
    let config = CONFIG.load(deps.as_ref().storage).unwrap();
    if config.admin != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    let id = PROJECT_DEALS_COUNT.update(deps.storage, |id| StdResult::Ok(id + 1))?;
    let project = Project {
        name,
        description,
        document_deal_link,
        max_wattpeak,
        minted_wattpeak_count: 0,
    };

    project.validate()?;

    PROJECTS.save(deps.storage, id, &project)?;

    AVAILABLE_WATTPEAK_COUNT.update(deps.storage, |available_wattpeak_count| {
        StdResult::Ok(available_wattpeak_count + project.max_wattpeak)
    })?;

    Ok(Response::new()
        .add_attribute("action", "upload_project")
        .add_attribute("project_id", id.to_string())
        .add_attribute("new_wattpeak", project.max_wattpeak.to_string()))
}

pub fn edit_project(
    deps: DepsMut,
    info: MessageInfo,
    id: u64,
    name: String,
    description: String,
    document_deal_link: String,
    max_wattpeak: u64,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
    // Only admin can edit a project
    let config = CONFIG.load(deps.as_ref().storage)?;
    if config.admin != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    let mut project = PROJECTS.load(deps.storage, id)?;
    
    // Save the old max_wattpeak for comparison
    let old_max_wattpeak = project.max_wattpeak;

    project.name = name;
    project.description = description;
    project.document_deal_link = document_deal_link;
    project.max_wattpeak = max_wattpeak;

    project.validate()?;

    PROJECTS.save(deps.storage, id, &project)?;

    // Update AVAILABLE_WATTPEAK_COUNT based on the change in max_wattpeak
    if max_wattpeak > old_max_wattpeak {
        // If new max_wattpeak is higher, adds the difference to AVAILABLE_WATTPEAK_COUNT
        AVAILABLE_WATTPEAK_COUNT.update(deps.storage, |available_wattpeak_count| {
            let diff = max_wattpeak - old_max_wattpeak;
            available_wattpeak_count.checked_add(diff).ok_or(ContractError::Overflow {})
        })?;
    } else if max_wattpeak < old_max_wattpeak {
        // If new max_wattpeak is lower, subtracts the difference from AVAILABLE_WATTPEAK_COUNT
        AVAILABLE_WATTPEAK_COUNT.update(deps.storage, |available_wattpeak_count| {
            let diff = old_max_wattpeak - max_wattpeak;
            available_wattpeak_count.checked_sub(diff).ok_or(ContractError::Overflow {})
        })?;
    }

    Ok(Response::new()
        .add_attribute("action", "edit_project")
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
) -> Result<Response<TokenFactoryMsg>, ContractError> {
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

    Ok(Response::new().add_attribute("action", "update_config"))
}

pub fn mint_tokens_msg(
    deps: DepsMut,
    info: MessageInfo,
    address: String,
    amount: Uint128,
    project_id: u64,
) -> Result<Response<TokenFactoryMsg>, ContractError> {
    let config = CONFIG.load(deps.storage).unwrap();
    // Search for the project by name
    let project = PROJECTS.load(deps.storage, project_id);

    if !project.is_ok() {
        return Err(ContractError::ProjectNotFound {});
    }

    let project = project.unwrap();

    if amount.u128() > (project.max_wattpeak - project.minted_wattpeak_count) as u128 {
        return Err(ContractError::InsufficientWattpeak {});
    }

    // Calculate the total cost and fee based on the amount to mint
    let minting_price = amount.checked_mul(config.minting_price.amount).unwrap();
    let minting_fee_calculation = Decimal::from_str(&minting_price.to_string())
        .unwrap()
        .checked_mul(config.minting_fee_percentage)
        .unwrap();
    let minting_fee = Uint128::from(minting_fee_calculation.to_string().parse::<u128>().unwrap());
    let total_cost = minting_price.checked_add(minting_fee).unwrap();

    if info.funds.iter().any(|coin| coin.amount < total_cost) {
        return Err(ContractError::InsufficientFunds {});
    }
    if info.funds.iter().any(|coin| coin.amount > total_cost) {
        return Err(ContractError::TooMuchFunds {});
    }

    // Prepare messages for the payment and fee transfers
    let payment_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: config.minting_payment_address.to_string(),
        amount: vec![Coin {
            denom: config.minting_price.denom.clone(),
            amount: minting_price,
        }],
    });

    let fee_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: config.minting_fee_address.to_string(),
        amount: vec![Coin {
            denom: config.minting_price.denom.clone(),
            amount: minting_fee,
        }],
    });

    // Prepare the minting message
    let mint_msg = TokenFactoryMsg::MintTokens {
        denom: SUBDENOM.to_string(),
        amount,
        mint_to_address: address,
    };

    AVAILABLE_WATTPEAK_COUNT.update(deps.storage, |available_wattpeak_count| {
        StdResult::Ok(available_wattpeak_count - amount.u128() as u64)
    })?;

    PROJECTS.update(deps.storage, project_id, |project| {
        let mut project = project.unwrap();
        project.minted_wattpeak_count += amount.u128() as u64;
        StdResult::Ok(project)
    })?;

    TOTAL_WATTPEAK_MINTED_COUNT.update(deps.storage, |total_wattpeak_minted_count| {
        StdResult::Ok(total_wattpeak_minted_count + amount.u128() as u64)
    })?;

    // Assuming your contract's execution logic proceeds with these messages
    Ok(Response::new()
        .add_message(payment_msg)
        .add_message(fee_msg)
        .add_message(mint_msg)
        .add_attribute("action", "mint_tokens"))
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
            minting_price: coin(5, "umpwr"),
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
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use cosmwasm_std::{coins, StdError};

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
            assert_eq!(
                err,
                ContractError::Std(StdError::generic_err(
                    "max_wattpeak cannot be zero".to_string()
                ))
            );
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
        #[test]
        fn test_upload_multiple_projects() {
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
            let _ = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

            let msg = crate::msg::ExecuteMsg::UploadProject {
                name: "test name2".to_string(),
                description: "test description2".to_string(),
                document_deal_link: "ipfs://test-link2".to_string(),
                max_wattpeak: 3000,
            };
            let _ = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

            let msg = crate::msg::ExecuteMsg::UploadProject {
                name: "test name3".to_string(),
                description: "test description3".to_string(),
                document_deal_link: "ipfs://test-link3".to_string(),
                max_wattpeak: 3000,
            };
            let _ = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

            let project_deals_count = PROJECT_DEALS_COUNT.load(deps.as_ref().storage).unwrap();
            assert_eq!(project_deals_count, 3);

            let project1 = PROJECTS.load(deps.as_ref().storage, 1).unwrap();
            assert_eq!(project1.name, "test name");
            assert_eq!(project1.description, "test description");
            assert_eq!(project1.document_deal_link, "ipfs://test-link");
            assert_eq!(project1.max_wattpeak, 1000);

            let project2 = PROJECTS.load(deps.as_ref().storage, 2).unwrap();
            assert_eq!(project2.name, "test name2");
            assert_eq!(project2.description, "test description2");
            assert_eq!(project2.document_deal_link, "ipfs://test-link2");
            assert_eq!(project2.max_wattpeak, 3000);

            let project3 = PROJECTS.load(deps.as_ref().storage, 3).unwrap();
            assert_eq!(project3.name, "test name3");
            assert_eq!(project3.description, "test description3");
            assert_eq!(project3.document_deal_link, "ipfs://test-link3");
            assert_eq!(project3.max_wattpeak, 3000);
        }
    }
    #[cfg(test)]
    mod edit_project_tests {
        use crate::execute::execute;
        use crate::execute::tests::{mock_config, MOCK_ADMIN};
        use crate::instantiate;
        use crate::msg::InstantiateMsg;
        use crate::state::PROJECTS;
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use cosmwasm_std::{coins, StdError};

        #[test]
        fn test_edit_project() {
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
            execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

            let edit_msg = crate::msg::ExecuteMsg::EditProject {
                id: 1,
                name: "new name".to_string(),
                description: "new description".to_string(),
                document_deal_link: "ipfs://new-link".to_string(),
                max_wattpeak: 2000,
            };
            let res = execute(deps.as_mut(), mock_env(), info.clone(), edit_msg).unwrap();
            assert_eq!(res.attributes.len(), 3);

            let project_deal = PROJECTS.load(deps.as_ref().storage, 1).unwrap();
            assert_eq!(project_deal.name, "new name");
            assert_eq!(project_deal.description, "new description");
            assert_eq!(project_deal.document_deal_link, "ipfs://new-link");
            assert_eq!(project_deal.max_wattpeak, 2000);
            assert_eq!(project_deal.minted_wattpeak_count, 0);
        }

        #[test]
        fn invalid_edit_project() {
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

            // First, successfully upload a project
            let msg = crate::msg::ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

            // Attempt to edit the project with an invalid max_wattpeak
            let edit_msg_max_wattpeak = crate::msg::ExecuteMsg::EditProject {
                id: 1,
                name: "new name".to_string(),
                description: "new description".to_string(),
                document_deal_link: "ipfs://new-link".to_string(),
                max_wattpeak: 0,
            };
            let err_max_wattpeak = execute(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                edit_msg_max_wattpeak,
            )
            .unwrap_err();
            assert_eq!(
                err_max_wattpeak,
                crate::error::ContractError::Std(StdError::generic_err(
                    "max_wattpeak cannot be zero".to_string()
                ))
            );

            // Attempt to edit the project with an empty name
            let edit_msg_empty_name = crate::msg::ExecuteMsg::EditProject {
                id: 1,
                name: "".to_string(),
                description: "new description".to_string(),
                document_deal_link: "ipfs://new-link".to_string(),
                max_wattpeak: 500,
            };
            let err_empty_name =
                execute(deps.as_mut(), mock_env(), info.clone(), edit_msg_empty_name).unwrap_err();
            assert_eq!(
                err_empty_name,
                crate::error::ContractError::Std(StdError::generic_err(
                    "name cannot be empty".to_string()
                ))
            );

            // Attempt to edit the project with an empty description
            let edit_msg_empty_description = crate::msg::ExecuteMsg::EditProject {
                id: 1,
                name: "new name".to_string(),
                description: "".to_string(),
                document_deal_link: "ipfs://new-link".to_string(),
                max_wattpeak: 500,
            };
            let err_empty_description = execute(
                deps.as_mut(),
                mock_env(),
                info.clone(),
                edit_msg_empty_description,
            )
            .unwrap_err();
            assert_eq!(
                err_empty_description,
                crate::error::ContractError::Std(StdError::generic_err(
                    "description cannot be empty".to_string()
                ))
            );
        }

        #[test]
        fn test_edit_project_unauthorized() {
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
            execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

            let edit_msg = crate::msg::ExecuteMsg::EditProject {
                id: 1,
                name: "new name".to_string(),
                description: "new description".to_string(),
                document_deal_link: "ipfs://new-link".to_string(),
                max_wattpeak: 2000,
            };
            let non_admin_info = mock_info("non_admin", &[]);
            let err =
                execute(deps.as_mut(), mock_env(), non_admin_info.clone(), edit_msg).unwrap_err();
            assert_eq!(err, crate::error::ContractError::Unauthorized {});
        }
    }
    mod update_config_tests {
        use crate::error::ContractError;
        use crate::execute::execute;
        use crate::execute::tests::{mock_config, MOCK_ADMIN};
        use crate::instantiate;
        use crate::msg::ExecuteMsg;
        use crate::state::CONFIG;
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use cosmwasm_std::{coins, Addr, Coin, Decimal, StdError};

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
            assert_eq!(res.attributes.len(), 1);

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

    mod mint_token_tests {

        use super::*;
        use crate::error::ContractError;
        use crate::execute::{execute, mint_tokens_msg};
        use crate::instantiate;
        use crate::msg::{ExecuteMsg, InstantiateMsg};
        use crate::state::{AVAILABLE_WATTPEAK_COUNT, CONFIG, PROJECTS};
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use cosmwasm_std::{coins, BankMsg, Coin, CosmosMsg, StdError, Uint128};
        use token_bindings::TokenFactoryMsg;

        #[test]
        fn test_mint_tokens_exact_funds() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(1000, "WattPeak"));
            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };
            CONFIG.save(deps.as_mut().storage, &config).unwrap();
            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(500);

            // Scenario: Exact funds provided
            let funds_provided = coins(Uint128::new(2625).into(), "umpwr");
            let info = mock_info("user", &funds_provided);

            let res = mint_tokens_msg(
                deps.as_mut(),
                info,
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();

            let wp_after_mint = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(wp_after_mint, 500);
            let project_wattpeak_after_mint = PROJECTS
                .load(deps.as_ref().storage, 1)
                .unwrap()
                .minted_wattpeak_count;
            assert_eq!(project_wattpeak_after_mint, 500);
            assert_eq!(3, res.messages.len());
            assert_eq!(
                res.messages[0].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "mock_address_1".to_string(),
                    amount: vec![Coin::new(2500, "umpwr".to_string())],
                })
            );
            assert_eq!(
                res.messages[1].msg,
                CosmosMsg::Bank(BankMsg::Send {
                    to_address: "mock_address_2".to_string(),
                    amount: vec![Coin::new(125, "umpwr".to_string())],
                })
            );
            assert_eq!(
                res.messages[2].msg,
                CosmosMsg::Custom(TokenFactoryMsg::MintTokens {
                    denom: "uwattpeak".to_string(),
                    amount: amount_to_mint,
                    mint_to_address: "mint_to_addr".to_string(),
                })
            );

            assert_eq!(res.attributes, vec![("action", "mint_tokens")]);
        }

        #[test]
        fn test_mint_tokens_insufficient_funds() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(1000, "WattPeak"));

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(100);

            // Scenario: Insufficient funds provided
            let insufficient_funds = coins(0, "mpwr");
            let info = mock_info("user", &insufficient_funds);

            let err = mint_tokens_msg(
                deps.as_mut(),
                info,
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap_err();

            assert_eq!(err, ContractError::InsufficientFunds {});
        }

        #[test]
        fn test_minting_more_than_available() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(1000, "WattPeak"));

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(1001);

            // Scenario: Minting more than available
            let funds_provided = coins(Uint128::new(2625).into(), "umpwr");
            let info = mock_info("user", &funds_provided);

            let err = mint_tokens_msg(
                deps.as_mut(),
                info,
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap_err();

            assert_eq!(err, ContractError::InsufficientWattpeak {});
        }

        #[test]
        fn test_minting_with_too_much_funds() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(1000, "WattPeak"));

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(500);

            // Scenario: Minting with too much funds
            let funds_provided = coins(Uint128::new(2626).into(), "umpwr");
            let info = mock_info("user", &funds_provided);

            let err = mint_tokens_msg(
                deps.as_mut(),
                info,
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap_err();

            assert_eq!(err, ContractError::TooMuchFunds {});
        }
        #[test]
        fn mint_a_project_that_doesnt_exist() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(1000, "WattPeak"));

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

            let amount_to_mint = Uint128::new(500);

            let funds_provided = coins(Uint128::new(2625).into(), "umpwr");
            let info = mock_info("user", &funds_provided);

            let err = mint_tokens_msg(
                deps.as_mut(),
                info,
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap_err();

            assert_eq!(err, ContractError::ProjectNotFound {});
        }
        #[test]
        fn multiple_projects_minted() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(1000, "WattPeak"));

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let project_msg = ExecuteMsg::UploadProject {
                name: "test name2".to_string(),
                description: "test description2".to_string(),
                document_deal_link: "ipfs://test-link2".to_string(),
                max_wattpeak: 1000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(500);

            let funds_provided = coins(Uint128::new(2625).into(), "umpwr");
            let info = mock_info("user", &funds_provided);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();

            let wp_after_mint = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(wp_after_mint, 1500);
            let project_wattpeak_after_mint = PROJECTS
                .load(deps.as_ref().storage, 1)
                .unwrap()
                .minted_wattpeak_count;
            assert_eq!(project_wattpeak_after_mint, 500);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                2,
            )
            .unwrap();

            let wp_after_mint2 = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(wp_after_mint2, 1000);
            let project2_wattpeak_after_mint = PROJECTS
                .load(deps.as_ref().storage, 2)
                .unwrap()
                .minted_wattpeak_count;
            assert_eq!(project2_wattpeak_after_mint, 500);
        }
        #[test]
        fn mint_out_a_project_then_increase_it() {
            let mut deps = mock_dependencies();
            let funds_provided = coins(Uint128::new(2625).into(), "umpwr");
            let info = mock_info(MOCK_ADMIN, &funds_provided);

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 500,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(500);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();

            let wp_after_mint = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(wp_after_mint, 0);
            let project_wattpeak_after_mint1 = PROJECTS
                .load(deps.as_ref().storage, 1)
                .unwrap()
                .minted_wattpeak_count;
            assert_eq!(project_wattpeak_after_mint1, 500);

            let project_msg = ExecuteMsg::EditProject {
                id: 1,
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 2000,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(500);

            let funds_provided = coins(Uint128::new(2625).into(), "umpwr");
            let info = mock_info("user", &funds_provided);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();
            let project_wattpeak_after_mint2 = PROJECTS
                .load(deps.as_ref().storage, 1)
                .unwrap()
                .minted_wattpeak_count;
            assert_eq!(project_wattpeak_after_mint2, 1000);
        }
        #[test]
        fn mint_then_edit_project_minted_wattpeak_higher_than_available() {
            let mut deps = mock_dependencies();
            let funds_provided = coins(Uint128::new(2625).into(), "umpwr");
            let info = mock_info(MOCK_ADMIN, &funds_provided);

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 500,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(500);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();

            let wp_after_mint = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(wp_after_mint, 0);
            let project_wattpeak_after_mint1 = PROJECTS
                .load(deps.as_ref().storage, 1)
                .unwrap()
                .minted_wattpeak_count;
            assert_eq!(project_wattpeak_after_mint1, 500);

            let project_msg = ExecuteMsg::EditProject {
                id: 1,
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 400,
            };
            let err = execute(deps.as_mut(), mock_env(), info.clone(), project_msg);
            assert_eq!(
                err.unwrap_err(),
                crate::ContractError::Std(StdError::generic_err(
                    "minted_wattpeak_count cannot be greater than max_wattpeak"
                ))
            );
        }
        #[test]
        fn mint_then_edit_project_lowering_max_wattpeak() {
            let mut deps = mock_dependencies();
            let mut funds_provided = coins(Uint128::new(1575).into(), "umpwr");
            let mut info = mock_info(MOCK_ADMIN, &funds_provided);

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 500,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let amount_to_mint = Uint128::new(300);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();

            let project_msg = ExecuteMsg::EditProject {
                id: 1,
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 300,
            };
            let _ = execute(deps.as_mut(), mock_env(), info.clone(), project_msg);

            funds_provided = coins(Uint128::new(24).into(), "umpwr");
            info = mock_info(MOCK_ADMIN, &funds_provided);

            let err = mint_tokens_msg(
                deps.as_mut(),
                info,
                "mint_to_addr".to_string(),
                Uint128::new(4),
                1,
            )
            .unwrap_err();

            assert_eq!(err, ContractError::InsufficientWattpeak{});
        }
        #[test]
        fn several_mints_and_edits() {
            let mut deps = mock_dependencies();
            let mut funds_provided = coins(Uint128::new(1050).into(), "umpwr");
            let mut info = mock_info(MOCK_ADMIN, &funds_provided);

            let config = mock_config();
            let msg = InstantiateMsg {
                config: config.clone(),
            };

            let _res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            let project_msg = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 500,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let mut amount_to_mint = Uint128::new(200);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();

            let count_after_mint = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(count_after_mint, 300);

            let project_msg = ExecuteMsg::EditProject {
                id: 1,
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 400,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let count_after_edit = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(count_after_edit, 200);


            amount_to_mint = Uint128::new(100);
            funds_provided = coins(Uint128::new(525).into(), "umpwr");
            info = mock_info(MOCK_ADMIN, &funds_provided);

            mint_tokens_msg(
                deps.as_mut(),
                info.clone(),
                "mint_to_addr".to_string(),
                amount_to_mint,
                1,
            )
            .unwrap();

            let count_after_mint2 = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(count_after_mint2, 100);

            let project_msg = ExecuteMsg::EditProject {
                id: 1,
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 300,
            };
            execute(deps.as_mut(), mock_env(), info.clone(), project_msg).unwrap();

            let count_after_edit2 = AVAILABLE_WATTPEAK_COUNT
                .load(deps.as_ref().storage)
                .unwrap();
            assert_eq!(count_after_edit2, 0);

        }
    }
}
