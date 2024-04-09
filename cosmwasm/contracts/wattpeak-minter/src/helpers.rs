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

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::CosmosMsg;
    use token_bindings::TokenFactoryMsg;

#[test]
    fn test_create_denom() {
        fn serialize_message(msg: &TokenFactoryMsg) -> Result<Vec<u8>, cosmwasm_std::StdError> {
            let serialized_msg = cosmwasm_std::to_vec(&msg)?;
            Ok(serialized_msg)
        }
        // Create an instance of MsgCreateDenom with example data
        let subdenom = "wattpeak".to_string();
        let full_denom = "wattpeak".to_string();
        let denom = NewDenom {
                name: "WattPeak".to_string(),
                description: Some("WattPeak is a token that represents the amount of wattpeak that a solarpanel represents".to_string()),
                symbol: "WattPeak".to_string(),
                decimals: 0,
                initial_balances: None,
            };

        let msg = create_denom_msg(subdenom, full_denom, denom);

        let serialized_msg = serialize_message(&msg).unwrap();

        // The type_url for the MsgCreateDenom based on its Protobuf definition
        let type_url = "/osmosis.tokenfactory.v1beta1.MsgCreateDenom";

        let expected_msg: CosmosMsg = CosmosMsg::Stargate {
            type_url: type_url.into(),
            value: cosmwasm_std::Binary(serialized_msg),
        };

        if let CosmosMsg::Stargate { type_url, value } = &expected_msg {
            assert_eq!(type_url, "/osmosis.tokenfactory.v1beta1.MsgCreateDenom");
            assert!(
                !value.0.is_empty(),
                "The serialized message should not be empty"
            );
        } else {
            panic!("Expected CosmosMsg::Stargate variant");
        }
    }
    #[test]
    fn test_serialization_cycle() {

        fn serialize_message(msg: &TokenFactoryMsg) -> Result<Vec<u8>, cosmwasm_std::StdError> {
            let serialized_msg = cosmwasm_std::to_vec(&msg)?;
            Ok(serialized_msg)
        }
        let msg = create_denom_msg(
            "WattPeak".to_string(),
            "full_wattpeak".to_string(),
            NewDenom { 
                name: "WattPeak".to_string(),
                description: Some("WattPeak is a token that represents the amount of wattpeak that a solarpanel represents".to_string()),
                symbol: "WattPeak".to_string(),
                decimals: 0,
                initial_balances: None,},
        );

        let serialized = serialize_message(&msg).unwrap();
        let deserialized: TokenFactoryMsg = cosmwasm_std::from_slice(&serialized).unwrap();

        // Assertions to check the deserialized content matches the original message
        match deserialized {
            TokenFactoryMsg::CreateDenom { subdenom, metadata } => {
                assert_eq!(subdenom, "WattPeak");
                assert_eq!(metadata.clone().unwrap().name.unwrap(), "WattPeak".to_string());
                assert_eq!(metadata.clone().unwrap().description, Some("WattPeak is a token that represents the amount of wattpeak that a solarpanel represents".to_string()));
                assert_eq!(metadata.clone().unwrap().denom_units[0].denom, "full_wattpeak");
                assert_eq!(metadata.clone().unwrap().denom_units[0].exponent, 0);
                assert_eq!(metadata.clone().unwrap().denom_units[1].denom, "WattPeak");
                assert_eq!(metadata.clone().unwrap().denom_units[1].exponent, 0);
            }
            _ => panic!("Unexpected message type"),
        }
    }
}