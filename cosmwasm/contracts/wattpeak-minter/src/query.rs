use cosmwasm_std::{entry_point, to_json_binary, Binary, Deps, Env, Order, StdResult};
use cw_storage_plus::Bound;

use crate::msg::{ProjectsResponse, QueryMsg};
use crate::state::{CONFIG, Config, Project, PROJECTS};

pub const DEFAULT_LIMIT: u64 = 30;

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Projects { limit, start_after} => to_json_binary(&projects(deps, start_after, limit)?),
        QueryMsg::Project { id } => to_json_binary(&project(deps, id)?),
        QueryMsg::Config { .. } => to_json_binary(&config(deps)?),
    }
}

pub fn projects(
    deps: Deps,
    start_after: Option<u64>,
    limit: Option<u64>,
) -> StdResult<ProjectsResponse> {
    let limit = limit.unwrap_or(DEFAULT_LIMIT);
    let start = start_after.map(Bound::exclusive);

    let projects: Vec<Project> = PROJECTS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit as usize)
        .map(|item| {
            let (_, project) = item?;
            Ok(project)
        })
        .collect::<StdResult<Vec<Project>>>()?;

    Ok(ProjectsResponse { projects })
}

pub fn project(deps: Deps, id: u64) -> StdResult<Project> {
    let project = PROJECTS.load(deps.storage, id)?;
    Ok(project)
}

pub fn config(deps: Deps) -> StdResult<Config> {
    let config = CONFIG.load(deps.storage)?;
    Ok(config)
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

    mod test_query_projects {
        use cosmwasm_std::{coins, from_json};
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use crate::execute::execute;
        use crate::instantiate;
        use crate::msg::{ExecuteMsg, InstantiateMsg, ProjectsResponse, QueryMsg};
        use crate::query::query;
        use crate::query::tests::{MOCK_ADMIN, mock_config};

        #[test]
        fn test_query_projects() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(deps.as_mut(), mock_env(), info.clone(), InstantiateMsg { config: mock_config() }).unwrap();

            let res  = query(deps.as_ref(), mock_env(), QueryMsg::Projects {
                limit: None,
                start_after: None,
            }).unwrap();
            let res: ProjectsResponse = from_json(&res).unwrap();
            assert_eq!(res.projects.len(), 0);

            let upload_first = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
                image_link: "ipfs://test-image".to_string(),
            };
            execute(deps.as_mut(), mock_env(), info.clone(), upload_first).unwrap();
            let upload_second = ExecuteMsg::UploadProject {
                name: "test name 2".to_string(),
                description: "test description 2".to_string(),
                document_deal_link: "ipfs://test-link-2".to_string(),
                max_wattpeak: 2000,
                image_link: "ipfs://test-image-2".to_string(),
            };
            execute(deps.as_mut(), mock_env(), info.clone(), upload_second).unwrap();

            let res  = query(deps.as_ref(), mock_env(), QueryMsg::Projects {
                limit: None,
                start_after: None,
            }).unwrap();
            let res: ProjectsResponse = from_json(&res).unwrap();
            assert_eq!(res.projects.len(), 2);
            assert_eq!(res.projects[0].name, "test name");
            assert_eq!(res.projects[0].description, "test description");
            assert_eq!(res.projects[0].document_deal_link, "ipfs://test-link");
            assert_eq!(res.projects[0].max_wattpeak, 1000);
            assert_eq!(res.projects[1].name, "test name 2");
            assert_eq!(res.projects[1].description, "test description 2");
            assert_eq!(res.projects[1].document_deal_link, "ipfs://test-link-2");
            assert_eq!(res.projects[1].max_wattpeak, 2000);
        }

        #[test]
        fn test_query_projects_limit_and_start() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(deps.as_mut(), mock_env(), info.clone(), InstantiateMsg { config: mock_config() }).unwrap();

            // Loop to create 10 projects
            for i in 0..10 {
                let upload = ExecuteMsg::UploadProject {
                    name: format!("test name {}", i),
                    description: format!("test description {}", i),
                    document_deal_link: format!("ipfs://test-link-{}", i),
                    max_wattpeak: 1000 * (i + 1),
                    image_link: format!("ipfs://test-image-{}", i),
                };
                execute(deps.as_mut(), mock_env(), info.clone(), upload).unwrap();
            }

            let res  = query(deps.as_ref(), mock_env(), QueryMsg::Projects {
                limit: Some(2),
                start_after: None,
            }).unwrap();
            let res: ProjectsResponse = from_json(&res).unwrap();
            assert_eq!(res.projects.len(), 2);
            assert_eq!(res.projects[0].name, "test name 0");
            assert_eq!(res.projects[1].name, "test name 1");


            let res  = query(deps.as_ref(), mock_env(), QueryMsg::Projects {
                limit: Some(2),
                start_after: Some(2),
            }).unwrap();
            let res: ProjectsResponse = from_json(&res).unwrap();
            assert_eq!(res.projects.len(), 2);
            assert_eq!(res.projects[0].name, "test name 2");
            assert_eq!(res.projects[1].name, "test name 3");

            let res = query(deps.as_ref(), mock_env(), QueryMsg::Projects {
                limit: Some(11),
                start_after: None,
            }).unwrap();
            let res: ProjectsResponse = from_json(&res).unwrap();
            assert_eq!(res.projects.len(), 10);
        }
    }

    mod test_query_project {
        use cosmwasm_std::{coins, from_json, StdError};
        use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
        use crate::execute::execute;
        use crate::instantiate;
        use crate::msg::{ExecuteMsg, InstantiateMsg};
        use crate::query::query;
        use crate::query::tests::{MOCK_ADMIN, mock_config};

        #[test]
        fn test_query_project() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(deps.as_mut(), mock_env(), info.clone(), InstantiateMsg { config: mock_config() }).unwrap();

            let upload_first = ExecuteMsg::UploadProject {
                name: "test name".to_string(),
                description: "test description".to_string(),
                document_deal_link: "ipfs://test-link".to_string(),
                max_wattpeak: 1000,
                image_link: "ipfs://test-image".to_string(),
            };
            execute(deps.as_mut(), mock_env(), info.clone(), upload_first).unwrap();

            let res = query(deps.as_ref(), mock_env(), crate::msg::QueryMsg::Project {
                id: 1,
            }).unwrap();
            let project: crate::state::Project = from_json(&res).unwrap();
            assert_eq!(project.name, "test name");
            assert_eq!(project.description, "test description");
            assert_eq!(project.document_deal_link, "ipfs://test-link");
            assert_eq!(project.max_wattpeak, 1000);
            assert_eq!(project.minted_wattpeak_count, 0);
        }

        #[test]
        fn test_query_project_not_found() {
            let mut deps = mock_dependencies();
            let info = mock_info(MOCK_ADMIN, &coins(2, "token"));
            instantiate(deps.as_mut(), mock_env(), info.clone(), InstantiateMsg { config: mock_config() }).unwrap();

            let err = query(deps.as_ref(), mock_env(), crate::msg::QueryMsg::Project {
                id: 1,
            }).unwrap_err();
            assert_eq!(err, StdError::NotFound { kind: "wattpeak_minter::state::Project".to_string() });
        }
    }
}
