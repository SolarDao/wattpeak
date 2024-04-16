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

    #[error("insufficient wattpeak available")]
    InsufficientWattpeak {},

    #[error("too much funds sent in")]
    TooMuchFunds {},

    #[error("project not found")]
    ProjectNotFound {},

    #[error("max wattpeak cannot be zero")]
    MaxWattpeakCannotBeZero {},

    #[error("name cannot be empty")]
    NameCannotBeEmpty {},

    #[error("description cannot be empty")]
    DescriptionCannotBeEmpty {},

    #[error("minted_wattpeak_count cannot be greater than max_wattpeak")]
    MintedWattpeakCountCannotBeGreaterThanMaxWattpeak {},

    #[error("calculation error")]
    CalculationError {},
}