use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Decimal, Uint128};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub rewards_percentage: Decimal,
    // Epoch length in seconds
    pub epoch_length: u64,
}
#[cw_serde]
pub struct Staker {
    // Total amount of Wattpeak staked
    pub wattpeak_staked: Uint128,
    // Total amount of interest earned in interest_wattpeak, represents a pro rata fraction of total wattpeak interest earned
    pub interest_wattpeak: Decimal,
    pub stake_start_time: u64,
    pub claimable_rewards: Decimal,
}

/// CONFIG is the configuration of the contract
pub const CONFIG: Item<Config> = Item::new("config");

pub const STAKERS: Map<Addr, Staker> = Map::new("stakers");

pub const TOTAL_WATTPEAK_STAKED: Item<Uint128> = Item::new("total_wattpeak_in_contract");

pub const TOTAL_INTEREST_WATTPEAK: Item<Decimal> = Item::new("total_interest_wattpeak_in_contract");

pub const PERCENTAGE_OF_YEAR: Item<Decimal> = Item::new("percentage_of_year");

pub const EPOCH_COUNT: Item<u64> = Item::new("epoch_count");