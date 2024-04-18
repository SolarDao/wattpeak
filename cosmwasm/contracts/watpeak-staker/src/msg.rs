use cosmwasm_schema::cw_serde;
use cosmwasm_std::Uint128;

use crate::state::Config;

#[cw_serde]
pub struct InstantiateMsg {
    pub config: Config,
}

#[cw_serde]
pub enum ExecuteMsg {
    Stake { 
        amount: Uint128
    },
}
