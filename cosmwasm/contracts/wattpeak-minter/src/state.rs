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

#[cw_serde]
pub struct Location {
    pub latitude: String,
    pub longitude: String,
}

impl Location {
    pub fn validate(&self) -> StdResult<()> {
        let lat = self
            .latitude
            .parse::<f64>()
            .map_err(|_| StdError::generic_err("Invalid latitude format"))?;
        let lon = self
            .longitude
            .parse::<f64>()
            .map_err(|_| StdError::generic_err("Invalid longitude format"))?;

        // Latitude must be between -90 and +90
        if lat < -90.0 || lat > 90.0 {
            return Err(StdError::generic_err(
                "Latitude must be between -90 and +90 degrees",
            ));
        }
        // Longitude must be between -180 and +180
        if lon < -180.0 || lon > 180.0 {
            return Err(StdError::generic_err(
                "Longitude must be between -180 and +180 degrees",
            ));
        }
        Ok(())
    }
}

// Implement a validation function for the config
impl Config {
    pub fn validate(&self, deps: Deps) -> StdResult<()> {
        deps.api.addr_validate(&self.admin.to_string())?;
        deps.api
            .addr_validate(&self.minting_payment_address.to_string())?;
        deps.api
            .addr_validate(&self.minting_fee_address.to_string())?;

        if self.minting_price.amount.is_zero() {
            return Err(StdError::generic_err("minting_price cannot be zero"));
        }
        if self.minting_price.denom.is_empty() {
            return Err(StdError::generic_err("minting_price denom cannot be empty"));
        }
        if self.minting_fee_percentage > Decimal::percent(100) {
            return Err(StdError::generic_err(
                "minting_fee_percentage cannot be greater than 100%",
            ));
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
    /// image_link is a link to an image of the project
    pub image_link: String,
    /// location is the location of the project
    pub location: Location,
    /// minted_wattpeak_count is the number of wattpeak that have been minted for this project
    pub minted_wattpeak_count: u64,
}

impl Project {
    pub fn validate(&self) -> StdResult<()> {
        if self.max_wattpeak == 0 {
            return Err(StdError::generic_err("max_wattpeak cannot be zero"));
        }
        if self.name.is_empty() {
            return Err(StdError::generic_err("name cannot be empty"));
        }
        if self.description.is_empty() {
            return Err(StdError::generic_err("description cannot be empty"));
        }
        if self.minted_wattpeak_count > self.max_wattpeak {
            return Err(StdError::generic_err(
                "minted_wattpeak_count cannot be greater than max_wattpeak",
            ));
        }
        Ok(())
    }
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

pub const FULL_DENOM: Item<String> = Item::new("token_full_denom");

pub const SUBDENOM: &str = "uwattpeakt";
pub const DESCRIPTION: &str =
    "wattpeak is a token that represents the amount of wattpeak that a solarpanel represents";
pub const SYMBOL: &str = "WTP";
pub const DECIMALS: u32 = 6;
pub const NAME: &str = "WattPeak";
