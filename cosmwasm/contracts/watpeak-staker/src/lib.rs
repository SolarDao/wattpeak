pub mod error;
pub mod msg;
pub mod state;


use crate::msg::InstantiateMsg;
use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response};
use error::ContractError;
use state::TOTAL_WATTPEAK_IN_CONTRACT;

#[entry_point]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {

    TOTAL_WATTPEAK_IN_CONTRACT.save(_deps.storage, &0).unwrap();

    Ok(Response::new())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::msg::InstantiateMsg;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();

        let msg = InstantiateMsg {
        };
        let info = mock_info("creator", &[]);

        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());

        let value = TOTAL_WATTPEAK_IN_CONTRACT.load(deps.as_ref().storage).unwrap();
        assert_eq!(0, value);
    }
}