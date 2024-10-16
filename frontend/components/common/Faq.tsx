import React from "react";
import {
  Box,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";

import { useColorModeValue } from "@interchain-ui/react";

export const Faq = () => {
  const inputColor = useColorModeValue("#000000B2", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.04)",
    "rgba(52, 52, 52, 1)"
  );

  const faqSections = [
    {
      sectionTitle: "General Questions",
      faqs: [
        {
          question: "What is SolarDAO?",
          answer:
            "SolarDAO is a decentralized organization that allows users to participate in solar energy projects through minting and staking Wattpeak tokens. The governance of the DAO is managed by the community through voting, and currently resides on the Juno blcockhain and is managed through DaoDao.",
        },
        {
          question: "What is the goal of SolarDAO?",
          answer:
            "SolarDAO aims to speed up the shift to renewable and green energy by actively crowdsourcing new solar energy production around the world and building or supporting technology to make the green shift happen. Ultimately SolarDAO should aim to become the worlds largest decentralised solar energy producer. SolarDAO can choose to invest and get ownership in utility scale solar parks and through various solutions and technologies. The SolarDAO will work to create value, for the DAO and thus for the DAO members.",
        },
        {
          question: "Which Solar Parks does SolarDAO invest in?",
          answer:
            "SolarDAO invests in utility scale solar parks around the world. The DAO aims to invest in solar parks that are already operational and producing energy, as well as new solar parks that are in the planning or construction phase. To see the current projects, go to the Home page for more information and a map showing the location of the different Parks, or go to the Mint section to mint $WP from one of the projects that has $WP available to mint..",
        },
        {
          question: "How can I connect my wallet?",
          answer:
            'Click on the "Connect Wallet" button at the top right corner and select your preferred wallet provider. Follow the prompts to authorize the connection.',
        },
        {
          question: "Are there any fees involved?",
          answer:
            "Yes, there are different fees associated with minting, staking, and swapping tokens. In addition to standard network and transaction fees the DAO also enforces swap fees, minting fees and staking reward fees. It's therefore good to have a small amount of extra $SOLAR and JUNO available to cover these fees. The current fees are displayed in the respective sections.",
        },
        {
          question:
            "Is there a minimum amount required for minting or staking?",
          answer:
            "The minimum amount may vary depending on the project. Please check the specific project details for more information.",
        },
        {
          question:
            "Which Blockchain does the dApp run on?",
          answer:
            "The SolarDAO and our dApp runs on  Juno and Stargaze, two Cosmos SDK based blockchains. The reason for this is that the Solar DAO and original $Solar token was created on the Juno blockchain, and the Cyber Solar Heroes were created on the Stargaze blockchain. The dApp is therefore running on both blockchains to support both tokens and NFTs.",
        },
        {
          question:
            "What limitations and complications does running on two Blockchains mean for the dApp?",
          answer:
            "One of the bigger complications at the moment is that in order for the user to swap $Solar tokens for Cyber Solar Heroes the user needs to have access to bridged $Solar tokens on the Stargaze blockchain. This is because the Cyber Solar Heroes are created on the Stargaze blockchain. When the dApp is deployed on the mainnets, the user will be able to bridge $Solar tokens from the Juno blockchain to the Stargaze blockchain. This will be done through the dApp, and the user will not have to leave the dApp to bridge the tokens.",
        },
      ],
    },
    {
      sectionTitle: "Minting",
      faqs: [
        {
          question: "How does minting work?",
          answer:
            "Minting allows you to create new Wattpeak tokens by investing in solar projects. Each token represents a share of the solar energy produced.",
        },
        {
          question: "How do I mint tokens?",
          answer:
            "To mint tokens, connect your wallet, go to the Mint section, select a solar project, and specify the amount you want to invest. Confirm the transaction, and the tokens will be minted to your wallet.",
        },

        {
          question: "What are WattPeak tokens?",
          answer:
            "$WattPeak are Solar-asset tokens, which each represent 1 wp of solar production capacity in utility scale solar parks. The revenue from each wp of production. represented by a $WattPeak , is reinvested into more solar production capacity and new $WattPeaks are issued to the holders pro-rata."
        },
        {
          question: "What is the benefit of minting Wattpeak tokens?",
          answer:
            "By minting Wattpeak tokens, you are directly investing in solar energy projects and contributing to a greener future. You also gain ownership in the energy produced.",
        },
      ],
    },
    {
      sectionTitle: "Staking",
      faqs: [
        {
          question: "What is staking?",
          answer:
            "Staking lets you lock your Wattpeak tokens to earn rewards over time. By staking, you ensure to get your share of the income generated by the solar parks that the DAO owns a stake in.",
        },
        {
          question: "What are Interest WattPeaks ($IWP)?",
          answer:
            "Interest WattPeak is a representation of the interest you earn by staking your Wattpeak tokens. The more tokens you stake, the more Interest WattPeak you earn. Since the profit from the Solar Parks are distributed as pro rata to how many tokens that are staked, the Interest WattPeak is a representation of how much you will earn of the rewards being distributed. Therefore you will not be rewarded with the same amount of WattPeak Tokens as the amount of  Interest WattPeak you have earned, since it will be relative to how many other tokens are staked and how much profit the Solar Parks generate.",
        },
        {
          question: "How do I stake my tokens?",
          answer:
            "Navigate to the Stake section, select the amount of Wattpeak tokens you want to stake, and confirm the transaction. Your tokens will be staked, and you'll start earning rewards.",
        },
        {
          question: "Can I withdraw my staked tokens anytime?",
          answer:
            "Yes, you can unstake your tokens at any time. However, please note that when you unstake, you won't earn the rewards for the day that you unstaked.",
        },
        {
          question: "What rewards do I get from staking?",
          answer:
            "By staking your Wattpeak tokens, you earn additional tokens as rewards, distributed yearly when income from the real life Solar Park is distributed. The reward rate may vary based on the total amount staked and the staking duration.",
        },
      ],
    },
    {
      sectionTitle: "Swapping",
      faqs: [
        {
          question: "What is swapping?",
          answer:
            "Swapping allows you to exchange your Cyber Solar Heroes for Solar tokens or the other way around at a set price. The reason for this is to create a baseline value for the NFTs",
        },
        {
          question: "How do I swap tokens?",
          answer:
            "Go to the Swapping section, choose the tokens or NFTs you want to swap, and confirm the transaction. The exchange will be processed on the blockchain.",
        },
        {
          question: "Are there any limits on swapping?",
          answer:
            "There may be limits based on liquidity and the availability of tokens or NFTs in the contract. Please check the swapping interface for the availability of Tokens and NFTs.",
        },
      ],
    },
  ];

  return (
    <Box
      maxW="600px"
      mx="auto"
      marginTop="22px"
      color={inputColor}
    >
      <Heading fontSize="30" fontWeight="500" mb={6} textAlign="center">
        Frequently Asked Questions
      </Heading>
      {faqSections.map((section, idx) => (
        <Box key={idx} mb={10} marginBottom="30px">
          <Heading fontSize="22px" fontWeight="500" mb={4}>
            {section.sectionTitle}
          </Heading>
          <Accordion allowMultiple>
            {section.faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                border="none"
                backgroundColor={backgroundColor}
                color={inputColor}
                borderRadius="20px"
                mb={4}
              >
                <h2>
                  <AccordionButton
                    backgroundColor={backgroundColor}
                    color={inputColor}
                    _expanded={{
                      bg: "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
                      color: "black",
                    }}
                    _hover={{
                      bg: "linear-gradient(180deg, #FFD602 0%, #FFA231 100%)",
                      color: "black",
                      cursor: "pointer",
                    }}
                    borderRadius="20px"
                  >
                    <Box flex="1" textAlign="left" fontWeight="bold" padding="5px">
                      {faq.question}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel paddingBottom="15px" paddingLeft="15px">{faq.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      ))}
    </Box>
  );
};

export default Faq;
