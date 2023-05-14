use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
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
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {}