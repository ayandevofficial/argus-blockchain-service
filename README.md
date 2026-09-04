# ARGUS Blockchain Service

Standalone blockchain trust service for ARGUS critical evidence chain of custody.

## What it does

- Anchors critical evidence hashes on-chain.
- Creates evidence custody-transfer records.
- Requires the receiving agency to confirm a transfer.
- Verifies an evidence hash against the anchored blockchain hash.
- Keeps evidence content and sensitive case data off-chain.

## Architecture

```text
ARGUS Backend
      |
      | REST API
      v
ARGUS Blockchain Service
      |
      | ethers.js
      v
EvidenceCustody Smart Contract
      |
      v
Local / Permissioned EVM Network
```

## Quick start

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
npm run compile
```

Start a local blockchain:

```bash
npm run node
```

In another terminal, deploy the contract:

```bash
npm run deploy
```

Copy the deployed contract address into `.env` as `CONTRACT_ADDRESS`. Set `PRIVATE_KEY` to one of the local Hardhat accounts printed by `npm run node`.

Start the service:

```bash
npm start
```

The service runs on `http://localhost:4300`.

## API

`POST /api/evidence/anchor` — anchor an evidence hash.

`GET /api/evidence/:evidenceId` — retrieve the on-chain anchor.

`POST /api/evidence/verify` — compare a current hash with the anchored hash.

`POST /api/custody/transfer` — create a custody transfer.

`POST /api/custody/transfer/confirm` — confirm receipt by the receiving organization.

`GET /api/custody/transfer/:transferId` — retrieve transfer status.

Example anchor body:

```json
{
  "evidenceId": "E-104",
  "evidenceHash": "0x<64-hex-character-sha256>",
  "agencyId": "AGENCY-A"
}
```

## ARGUS integration

The main ARGUS backend should send only identifiers, hashes and custody metadata to this service. Do not send raw evidence files, PII, case narratives, phone numbers or financial details.

Recommended integration calls:

```text
ARGUS
  -> POST /api/evidence/anchor
  -> POST /api/custody/transfer
  -> POST /api/custody/transfer/confirm
  -> POST /api/evidence/verify
```

## Production notes

This repository is an SIH prototype. For production deployment, use a permissioned consortium network, HSM-backed or managed signing keys, organization-specific authorization, encrypted off-chain evidence storage, rate limiting, request authentication, and monitoring.

The blockchain proves integrity/provenance of the anchored record; it does not by itself prove that underlying evidence is authentic, lawfully collected, or legally admissible.
