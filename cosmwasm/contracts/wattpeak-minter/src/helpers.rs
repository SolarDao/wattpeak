use token_bindings::{DenomUnit, Metadata, TokenFactoryMsg};
use crate::msg::NewDenom;

pub fn create_denom_msg(subdenom: String, full_denom: String, denom: NewDenom) -> TokenFactoryMsg {
    TokenFactoryMsg::CreateDenom {
        subdenom,
        metadata: Some(Metadata {
            name: Some(denom.name),
            description: denom.description,
            denom_units: vec![
                DenomUnit {
                    denom: full_denom.clone(),
                    exponent: 0,
                    aliases: vec![],
                },
                DenomUnit {
                    denom: denom.symbol.clone(),
                    exponent: denom.decimals,
                    aliases: vec![],
                },
            ],
            base: Some(full_denom),
            display: Some(denom.symbol.clone()),
            symbol: Some(denom.symbol),
        }),
    }
}