use cosmwasm_schema::{cw_serde, QueryResponses};
use crate::state::{Config, Project};

#[cw_serde]
pub struct InstantiateMsg {
    pub config: Config,
}

#[cw_serde]
pub enum ExecuteMsg {
    /// Upload a new project
    UploadProject {
        /// name of the project
        name: String,
        /// description is a short description of the project,
        description: String,
        /// document_link is a link to the legal document that describes the deal in all its details
        document_deal_link: String,
        /// max_wattpeak is the maximum amount of wattpeak that can be minted for this project
        max_wattpeak: u64,
    },
    EditProject {
        id: u64,
        name: String,
        description: String,
        document_deal_link: String,
        max_wattpeak: u64,
    },
    // TODO: add config update message
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(Config)]
    Config {},
    #[returns(ProjectsResponse)]
    Projects {
        /// The maximum number of listings to return as part of this
        /// query. If no limit is set a max of 30 listings will be
        /// returned.
        limit: Option<u64>,
        /// The address of the listing to start the query after. If
        /// this is set, the listing with this address will not be
        /// included in the results.
        start_after: Option<u64>,
    },
    #[returns(Project)]
    Project { id: u64 },
}

#[cw_serde]
pub struct ProjectsResponse {
    pub projects: Vec<Project>,
}