use cosmwasm_schema::cw_serde;
use cosmwasm_std::Uint128;

use crate::state::Config;

#[cw_serde]
pub struct InstantiateMsg {
    pub config: Config,
}

#[cw_serde]
pub enum ExecuteMsg {
    UpdateConfig {
        admin: Option<String>,
        rewards_percentage: Option<Uint128>,
    },
    Stake { 
        amount: Uint128
    },
    Unstake { 
        amount: Uint128
    },
    ClaimReward {},
    DepositRewards {
        amount: Uint128
    },
}
