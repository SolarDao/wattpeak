use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdResult};
use crate::{msg::ExecuteMsg, error::ContractError};
use crate::state::{AVAILABLE_WATTPEAK_COUNT, CONFIG, Project, PROJECT_DEALS_COUNT, PROJECTS};

#[entry_point]
pub fn execute(deps: DepsMut, _env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg { ExecuteMsg::UploadProject { name, description, document_deal_link, max_wattpeak } => upload_project(deps, info, name, description, document_deal_link, max_wattpeak) }
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

    AVAILABLE_WATTPEAK_COUNT.update(deps.storage, |available_wattpeak_count| StdResult::Ok(available_wattpeak_count + project.max_wattpeak))?;

    Ok(Response::new()
        .add_attribute("action", "upload_project")
        .add_attribute("project_id", id.to_string())
        .add_attribute("new_wattpeak", project.max_wattpeak.to_string())
    )
}

#[cfg(test)]
mod tests {
    use cosmwasm_std::{Addr, coin, Decimal};
    use crate::state::Config;

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
        use cosmwasm_std::coins;
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use crate::error::ContractError;
        use crate::execute::execute;
        use crate::{instantiate, state};
        use crate::execute::tests::{MOCK_ADMIN, mock_config};
        use crate::msg::InstantiateMsg;
        use crate::state::{PROJECT_DEALS_COUNT, PROJECTS};

        #[test]
        fn test_upload_project() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(deps.as_mut(), mock_env(), info.clone(), InstantiateMsg { config: mock_config() }).unwrap();

            let msg = crate::msg::ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
            };
            let res = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();
            assert_eq!(res.attributes.len(), 3);
            assert_eq!(res.attributes[0], ("action".to_string(), "upload_project".to_string()));
            assert_eq!(res.attributes[1], ("project_id".to_string(), "1".to_string()));
            assert_eq!(res.attributes[2], ("new_wattpeak".to_string(), "1000".to_string()));

            let project_deals_count = PROJECT_DEALS_COUNT.load(deps.as_ref().storage).unwrap();
            assert_eq!(project_deals_count, 1);

            let project_deal = PROJECTS.load(deps.as_ref().storage, 1).unwrap();
            assert_eq!(project_deal.name, "test name");
            assert_eq!(project_deal.description, "test description");
            assert_eq!(project_deal.document_deal_link, "ipfs://test-link");
            assert_eq!(project_deal.max_wattpeak, 1000);
            assert_eq!(project_deal.minted_wattpeak_count, 0);

            let available_wattpeak_count = state::AVAILABLE_WATTPEAK_COUNT.load(deps.as_ref().storage).unwrap();
            assert_eq!(available_wattpeak_count, 1000);

            let total_wattpeak_minted_count = state::TOTAL_WATTPEAK_MINTED_COUNT.load(deps.as_ref().storage).unwrap();
            assert_eq!(total_wattpeak_minted_count, 0);
        }

        #[test]
        fn invalid_upload_project() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(deps.as_mut(), mock_env(), info.clone(), InstantiateMsg { config: mock_config() }).unwrap();

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
            instantiate(deps.as_mut(), mock_env(), info.clone(), InstantiateMsg { config: mock_config() }).unwrap();

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
}
