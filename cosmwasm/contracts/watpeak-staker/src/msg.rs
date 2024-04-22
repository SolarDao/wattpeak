use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Decimal, Uint128};

use crate::state::{Config, Staker};

#[cw_serde]
pub struct InstantiateMsg {
    pub config: Config,
}

#[cw_serde]
pub enum ExecuteMsg {
    UpdateConfig {
        admin: Option<String>,
        rewards_percentage: Option<Decimal>,
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


#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(Config)]
    Config {},
    #[returns(Staker)]
    Staker { address: String },
    #[returns(StakersResponse)]
    Stakers {},
    #[returns(TotalWattpeakStakedResponse)] // Add the missing return type here
    TotalWattpeakStaked {},
    #[returns(TotalInterestWattpeakResponse)]
    TotalInterestWattpeak {},
    #[returns(EpochStateResponse)]
    EpochState {},
}

#[cw_serde]
pub struct StakersResponse {
    pub stakers: Vec<Staker>,
}

#[cw_serde]
pub struct TotalWattpeakStakedResponse {
    pub total_staked: Uint128,
}
#[cw_serde]
pub struct EpochStateResponse {
    pub epoch_length: u64,
    pub current_epoch: u32,
    pub epoch_start_time: u64,
}

#[cw_serde]
pub struct TotalInterestWattpeakResponse {
    pub total_interest: Decimal,
}
