# Tip ur Neighbor

A web application that implements Base's Sub Accounts, allowing users to tip their neighboring FIDs with No pop-ups or browser extensions.

## Overview

Smart Wallet's self-custodial design requires a user passkey prompt for each wallet interaction. While this ensures users approve every interaction, it impacts user experience for applications requiring frequent wallet interactions.

Sub Accounts allow you to provision wallet accounts directly embedded in your application. You can control when a Sub Account is created and interact with them like other wallets via wallet provider or popular web3 libraries like wagmi, viem, etc.

These Sub Accounts link to the user's Smart wallet through an onchain relationship. Combined with Spend Limits, this creates a powerful foundation for provisioning and funding app accounts securely while giving developers control over the user experience.

## Features

- Connect your Ethereum wallet using Smart Wallet
- Create Sub Accounts scoped to the app with Spend Limits
- Perform popup-less transactions
- Look up Farcaster IDs (FIDs) and find neighboring users
- Send cryptocurrency tips to neighboring Farcaster users
- Sign messages to verify your identity

## Technology Stack

- Next.js
- TypeScript
- Wagmi 
- Viem 
- Smart Wallet with Sub Accounts

## Getting Started

1. Clone the repository
2. Override the default @coinbase/wallet-sdk version with the canary version:
   ```
   npm pkg set overrides.@coinbase/wallet-sdk=canary
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Guide Sections

### Project Setup
- Creating a NextJS+Wagmi project
- Configuring Smart Wallet with development environment settings
- Setting up Spend Limits for native ETH
- Creating a basic wallet connection interface

### Using Sub Accounts
- Signing messages with Sub Accounts using useSignMessage
- Sending transactions with spend limits using useSendTransaction
- Building a complete interface for wallet connection and transactions
- Understanding transaction limitations based on Spend Limits

## Usage

1. Connect your Smart Wallet
2. App creates a Sub Account with Spend Limits
3. Enter your Farcaster ID (FID)
4. Browse neighboring FIDs
5. Send tips to Farcaster neighbors without passkey prompts

## Demo and Resources

For a live demo of Sub Accounts in action, check out the [Tip ur Neighbor](https://tu-n.vercel.app/).
