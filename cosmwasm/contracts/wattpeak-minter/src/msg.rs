use crate::state::{Config, Project};
use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Coin, Decimal};

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
    /// Update contract configuration
    UpdateConfig {
        /// new admin address
        admin: Addr,
        /// new minting price
        minting_price: Coin,
        /// new minting payment address
        minting_payment_address: Addr,
        /// new minting fee percentage
        minting_fee_percentage: Decimal,
        /// new minting fee address
        minting_fee_address: Addr,
    },

    MintTokens {
        /// The address to mint the tokens to
        address: String,
        /// The denomination of the tokens to mint
        denom: String,
        /// The amount of tokens to mint
        amount: u128,
    },
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
