use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response};
use crate::{msg::ExecuteMsg, error::ContractError};

#[entry_point]
pub fn execute(_deps: DepsMut, _env: Env, _info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {}
}
