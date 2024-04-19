use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Decimal, Env, Uint128};
use cw_storage_plus::{Item, Map};

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub rewards_percentage: Decimal,
}

#[cw_serde]
pub struct EpochState {
    pub epoch_length: u64,
    pub current_epoch: u32,
    pub epoch_start_time: u64,
}

impl EpochState {
    pub fn check_update_epoch(&mut self, env: &Env) {
        if env.block.time.seconds() >= self.epoch_start_time + self.epoch_length {
            self.current_epoch += 1;
            self.epoch_start_time = env.block.time.seconds();

            //The update rewards calculation should be done here
        }
    }
}

#[cw_serde]
pub struct Staker {
    pub address: Addr,
    pub wattpeak_staked: Uint128,
    pub interest_wattpeak: Decimal,
    pub stake_start_time: u64,
    pub claimable_rewards: Decimal,
}

/// CONFIG is the configuration of the contract
pub const CONFIG: Item<Config> = Item::new("config");

pub const EPOCH_STATE: Item<EpochState> = Item::new("epoch_state");

pub const STAKERS: Map<Addr, Staker> = Map::new("stakers");

pub const TOTAL_WATTPEAK_STAKED: Item<Uint128> = Item::new("total_wattpeak_in_contract");

pub const TOTAL_INTEREST_WATTPEAK: Item<Decimal> = Item::new("total_interest_wattpeak_in_contract");

pub const TOTAL_REWARDS: Item<Uint128> = Item::new("total_rewards_in_contract");