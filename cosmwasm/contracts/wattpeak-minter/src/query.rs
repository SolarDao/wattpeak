use cosmwasm_std::{entry_point, Deps, Env, StdResult, Binary};

use crate::msg::QueryMsg;

#[entry_point]
pub fn query(_deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {}
}