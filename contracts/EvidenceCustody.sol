// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract EvidenceCustody {
    enum TransferStatus { NONE, PENDING, CONFIRMED, REJECTED }

    struct EvidenceAnchor { bytes32 evidenceHash; uint64 timestamp; address anchoredBy; bool exists; }
    struct Transfer {
        bytes32 evidenceId; bytes32 evidenceHash; bytes32 fromAgency; bytes32 toAgency;
        uint64 createdAt; uint64 confirmedAt; address createdBy; address confirmedBy; TransferStatus status;
    }

    mapping(bytes32 => EvidenceAnchor) private evidenceAnchors;
    mapping(bytes32 => Transfer) private transfers;
    mapping(bytes32 => bool) public authorizedAgencies;
    address public immutable owner;

    event AgencyAuthorizationUpdated(bytes32 indexed agencyId, bool authorized);
    event EvidenceAnchored(bytes32 indexed evidenceId, bytes32 indexed evidenceHash, uint64 timestamp, address indexed anchoredBy);
    event TransferCreated(bytes32 indexed transferId, bytes32 indexed evidenceId, bytes32 fromAgency, bytes32 toAgency, bytes32 evidenceHash, uint64 timestamp, address indexed createdBy);
    event TransferConfirmed(bytes32 indexed transferId, bytes32 indexed evidenceId, uint64 timestamp, address indexed confirmedBy);

    error UnauthorizedAgency();
    error TransferAlreadyExists();
    error TransferNotPending();
    error NotRecipient();
    error EvidenceNotAnchored();

    constructor() { owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier onlyAuthorized(bytes32 agencyId) { if (!authorizedAgencies[agencyId]) revert UnauthorizedAgency(); _; }

    function setAgencyAuthorization(bytes32 agencyId, bool authorized) external onlyOwner {
        authorizedAgencies[agencyId] = authorized;
        emit AgencyAuthorizationUpdated(agencyId, authorized);
    }

    function anchorEvidence(bytes32 evidenceId, bytes32 evidenceHash, bytes32 agencyId) external onlyAuthorized(agencyId) {
        evidenceAnchors[evidenceId] = EvidenceAnchor(evidenceHash, uint64(block.timestamp), msg.sender, true);
        emit EvidenceAnchored(evidenceId, evidenceHash, uint64(block.timestamp), msg.sender);
    }

    function createTransfer(bytes32 transferId, bytes32 evidenceId, bytes32 fromAgency, bytes32 toAgency, bytes32 evidenceHash) external onlyAuthorized(fromAgency) {
        if (transfers[transferId].status != TransferStatus.NONE) revert TransferAlreadyExists();
        EvidenceAnchor memory anchor = evidenceAnchors[evidenceId];
        if (!anchor.exists) revert EvidenceNotAnchored();
        require(anchor.evidenceHash == evidenceHash, "hash mismatch");
        if (!authorizedAgencies[toAgency]) revert UnauthorizedAgency();
        transfers[transferId] = Transfer(evidenceId, evidenceHash, fromAgency, toAgency, uint64(block.timestamp), 0, msg.sender, address(0), TransferStatus.PENDING);
        emit TransferCreated(transferId, evidenceId, fromAgency, toAgency, evidenceHash, uint64(block.timestamp), msg.sender);
    }

    function confirmTransfer(bytes32 transferId, bytes32 receivingAgency) external onlyAuthorized(receivingAgency) {
        Transfer storage transfer = transfers[transferId];
        if (transfer.status != TransferStatus.PENDING) revert TransferNotPending();
        if (transfer.toAgency != receivingAgency) revert NotRecipient();
        transfer.status = TransferStatus.CONFIRMED;
        transfer.confirmedAt = uint64(block.timestamp);
        transfer.confirmedBy = msg.sender;
        emit TransferConfirmed(transferId, transfer.evidenceId, uint64(block.timestamp), msg.sender);
    }

    function getEvidenceAnchor(bytes32 evidenceId) external view returns (bytes32 evidenceHash, uint64 timestamp, address anchoredBy, bool exists) {
        EvidenceAnchor memory anchor = evidenceAnchors[evidenceId];
        return (anchor.evidenceHash, anchor.timestamp, anchor.anchoredBy, anchor.exists);
    }

    function getTransfer(bytes32 transferId) external view returns (Transfer memory) { return transfers[transferId]; }
}
