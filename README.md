# Decentralized Patent Office Smart Contract

## Overview
A Stacks blockchain smart contract for managing patent submissions, reviews, licensing, and renewals in a decentralized manner.

## Key Features
- Patent submission
- Peer review system
- Patent expiration and renewal
- License offering and purchasing
- Administrative controls

## Functions

### Patent Submission
- `submit-patent`: Create a new patent entry
- Requires title and description
- Assigns a unique patent ID
- Initial status is "pending"

### Patent Review
- `review-patent`: Allows up to 3 reviewers to approve/reject patents
- Patent moves to "approved" status with 3 approvals
- Prevents duplicate reviews

### Patent Management
- `renew-patent`: Extend patent duration before expiration
- Only inventor can renew
- Adds another 20-year block period

### Licensing
- `offer-license`: Inventor can set license price
- `purchase-license`: Others can buy patent usage rights
- Transfers STX tokens between parties

## Error Handling
Comprehensive error codes cover:
- Unauthorized actions
- Patent not found
- Invalid statuses
- Expiration issues
- Transfer failures

## Admin Controls
- Set review periods
- Adjust patent duration
- Restricted to contract owner

## Prerequisites
- Stacks blockchain
- Clarinet for local development
- Basic understanding of Clarity smart contract language

## Deployment
1. Compile contract
2. Deploy to Stacks network
3. Interact via wallet or developer tools
