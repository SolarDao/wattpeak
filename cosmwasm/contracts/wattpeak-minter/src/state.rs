use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Coin, Decimal, Deps, StdError, StdResult};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct Config {
    /// admin is the address of the admin which are the only entity allowed to upload new projects
    pub admin: Addr,
    /// minting_cost is the cost of minting 1 wattpeak
    pub minting_price: Coin,
    /// minting_payment_address is the address where the minting payment is sent to
    pub minting_payment_address: Addr,
    /// minting_fee_percentage is the fee percentage that is charged for minting wattpeak
    pub minting_fee_percentage: Decimal,
    /// minting_fee_address is the address where the minting fee is sent to (SolarDAO)
    pub minting_fee_address: Addr,
}

// Implement a validation function for the config
impl Config {
    pub fn validate(&self, deps: Deps) -> StdResult<()> {
        deps.api.addr_validate(&self.admin.to_string())?;
        deps.api.addr_validate(&self.minting_payment_address.to_string())?;
        deps.api.addr_validate(&self.minting_fee_address.to_string())?;

        if self.minting_price.amount.is_zero() {
            return Err(StdError::generic_err("minting_price cannot be zero"));
        }
        if self.minting_price.denom.is_empty() {
            return Err(StdError::generic_err("minting_price denom cannot be empty"));
        }
        if self.minting_fee_percentage > Decimal::percent(100) {
            return Err(StdError::generic_err("minting_fee_percentage cannot be greater than 100%"));
        }
        
        Ok(())
    }
}

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

/// CONFIG is the configuration of the contract
pub const CONFIG: Item<Config> = Item::new("config");

/// PROJECTS is the map of all projects, indexed by the project id
pub const PROJECTS: Map<u64, Project> = Map::new("project_deals");

/// PROJECT_DEALS_COUNT is the number of projects that have been uploaded
pub const PROJECT_DEALS_COUNT: Item<u64> = Item::new("project_deals_count");

/// AVAILABLE_WATTPEAK_COUNT is the number of wattpeak that are still available for minting
/// It is incremented when a new project is uploaded and decremented when new wattpeak are minted
pub const AVAILABLE_WATTPEAK_COUNT: Item<u64> = Item::new("available_wattpeak_count");

/// TOTAL_WATTPEAK_MINTED_COUNT is the total number of wattpeak that have been minted
pub const TOTAL_WATTPEAK_MINTED_COUNT: Item<u64> = Item::new("total_wattpeak_minted");
