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
  const inputColor = useColorModeValue("black", "white");
  const backgroundColor = useColorModeValue(
    "rgba(0, 0, 0, 0.09)",
    "rgba(52, 52, 52, 1)"
  );

  const faqSections = [
    {
      sectionTitle: "General Questions",
      faqs: [
        {
          question: "What is SolarDAO?",
          answer:
            "SolarDAO is a decentralized platform that allows users to participate in solar energy projects through minting, staking, and swapping tokens.",
        },
        {
          question: "How can I connect my wallet?",
          answer:
            'Click on the "Connect Wallet" button at the top right corner and select your preferred wallet provider. Follow the prompts to authorize the connection.',
        },
        {
          question: "Are there any fees involved?",
          answer:
            "Yes, there are minimal transaction fees for minting, staking, and swapping to cover network costs. There is also a minting fee that goes to the treasury of SolarDAO",
        },
        {
          question:
            "Is there a minimum amount required for minting or staking?",
          answer:
            "The minimum amount may vary depending on the project. Please check the specific project details for more information.",
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
            "To mint tokens, connect your wallet, select a solar project, and specify the amount you want to invest. Confirm the transaction, and the tokens will be minted to your wallet.",
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
          question: "How do I stake my tokens?",
          answer:
            "Navigate to the Stake section, select the amount of Wattpeak tokens you want to stake, and confirm the transaction. Your tokens will be staked, and you'll start earning rewards.",
        },
        {
          question: "Can I withdraw my staked tokens anytime?",
          answer:
            "Yes, you can unstake your tokens at any time. However, please note that unstaking may take a certain period to process, depending on network conditions.",
        },
        {
          question: "What rewards do I get from staking?",
          answer:
            "By staking your Wattpeak tokens, you earn additional tokens as rewards. The reward rate may vary based on the total amount staked and the staking duration.",
        },
      ],
    },
    {
      sectionTitle: "Swapping",
      faqs: [
        {
          question: "What is swapping?",
          answer:
            "Swapping allows you to exchange your Wattpeak tokens for other tokens or NFTs within the SolarDAO ecosystem.",
        },
        {
          question: "How do I swap tokens?",
          answer:
            "Go to the Swapping section, choose the tokens or NFTs you want to swap, and confirm the transaction. The exchange will be processed on the blockchain.",
        },
        {
          question: "Are there any limits on swapping?",
          answer:
            "There may be limits based on liquidity and the availability of tokens or NFTs. Please check the swapping interface for any specific limits.",
        },
        {
          question: "What tokens can I swap Wattpeak tokens for?",
          answer:
            "You can swap Wattpeak tokens for supported tokens and NFTs listed on the Swapping page. The available options may change over time.",
        },
      ],
    },
  ];

  return (
    <Box
      maxW="600px"
      mx="auto"
      py={8}
      px={4}
    >
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Frequently Asked Questions
      </Heading>
      {faqSections.map((section, idx) => (
        <Box key={idx} mb={10} marginBottom="30px">
          <Heading as="h2" size="lg" mb={4}>
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
