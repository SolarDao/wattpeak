use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("unauthorized")]
    Unauthorized {},

    #[error("insufficient funds to pay for minting")]
    InsufficientFunds {},

    #[error("insufficient wattpeak available")]
    InsufficientWattpeak {},

    #[error("too much funds sent in")]
    TooMuchFunds {},

    #[error("project not found")]
    ProjectNotFound {},

    #[error("overflows")]
    Overflow {},

    #[error("invalid minting price")]
    InvalidMintingPrice {},

    #[error("invalid amount")]
    InvalidAmount {},

    #[error("math error")]
    MathError {},
}