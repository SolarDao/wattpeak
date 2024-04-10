use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("unauthorized")]
    Unauthorized {},

    #[error("invalid max wattpeak")]
    InvalidMaxWattpeak {},

    #[error("insufficient funds to pay for minting")]
    InsufficientFunds {},
}