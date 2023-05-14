use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

/// Project is the struct that represents a project that can be minted
/// It also represent a legal deal that the SolarDAO legal entity has to buy into a solar project
#[cw_serde]
pub struct Project {
    /// name of the project
    pub name: String,
    /// description is a short description of the project,
    pub description: String,
    /// document_link is a link to the legal document that describes the deal in all its details
    pub document_deal_link: String,
    /// max_wattpeak is the maximum amount of wattpeak that can be minted for this project
    pub max_wattpeak: u64,
    /// minted_wattpeak_count is the number of wattpeak that have been minted for this project
    pub minted_wattpeak_count: u64,
}

/// ADMIN is the address of the admin which are the only entity allowed to upload new projects
pub const ADMIN: Item<Addr> = Item::new("admin");

/// PROJECTS is the map of all projects, indexed by the project id
pub const PROJECTS: Map<u64, Project> = Map::new("project_deals");

/// PROJECT_DEALS_COUNT is the number of projects that have been uploaded
pub const PROJECT_DEALS_COUNT: Item<u64> = Item::new("project_deals_count");

/// AVAILABLE_WATTPEAK_COUNT is the number of wattpeak that are still available for minting
/// It is incremented when a new project is uploaded and decremented when new wattpeak are minted
pub const AVAILABLE_WATTPEAK_COUNT: Item<u64> = Item::new("available_wattpeak_count");

/// TOTAL_WATTPEAK_MINTED_COUNT is the total number of wattpeak that have been minted
pub const TOTAL_WATTPEAK_MINTED_COUNT: Item<u64> = Item::new("total_wattpeak_minted");
