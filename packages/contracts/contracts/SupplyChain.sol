// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SupplyChain
/// @notice On-chain custody trail for physical products. Every registration,
/// handoff, and checkpoint (inspection, certification, delivery) is an
/// immutable, timestamped event — anyone can read a product's full history,
/// so provenance and authenticity checks are a single on-chain read instead
/// of cross-referencing siloed systems.
contract SupplyChain is Ownable, Pausable, ReentrancyGuard {
    enum EventType {
        Registered,
        Transferred,
        Inspected,
        Certified,
        Delivered,
        Recalled
    }

    struct Product {
        string name;
        address originator;
        address currentHolder;
        uint256 registeredAt;
        bool recalled;
    }

    struct CheckpointEvent {
        EventType eventType;
        address actor;
        address from;
        address to;
        string location;
        string note;
        uint256 timestamp;
    }

    uint256 private _nextProductId = 1;

    mapping(uint256 => Product) private _products;
    mapping(uint256 => CheckpointEvent[]) private _history;

    /// @notice Wallets allowed to register products and record custody
    /// events. Distinct from `owner` (administration — recalls, pausing,
    /// managing participants) so a Vibe Kit frontend works with whatever
    /// authorized participant wallet connects, not a single hard-coded one.
    mapping(address => bool) public isParticipant;

    event ParticipantUpdated(address indexed account, bool allowed);
    event ProductRegistered(uint256 indexed productId, address indexed originator, string name);
    event CustodyTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event CheckpointRecorded(uint256 indexed productId, EventType eventType, address indexed actor);
    event ProductRecalled(uint256 indexed productId, string reason);

    modifier onlyParticipant() {
        require(isParticipant[msg.sender], "SupplyChain: caller is not a participant");
        _;
    }

    constructor() Ownable(msg.sender) {
        isParticipant[msg.sender] = true;
        emit ParticipantUpdated(msg.sender, true);
    }

    /// @notice Owner-only. Grants or revokes participant rights — the way
    /// to add manufacturers, distributors, retailers, or inspectors without
    /// transferring contract ownership.
    function setParticipant(address account, bool allowed) external onlyOwner {
        require(account != address(0), "SupplyChain: zero address");
        isParticipant[account] = allowed;
        emit ParticipantUpdated(account, allowed);
    }

    /// @notice Registers a new product. The caller becomes both its
    /// originator and its first custodian.
    function registerProduct(
        string calldata name,
        string calldata location,
        string calldata note
    ) external onlyParticipant whenNotPaused nonReentrant returns (uint256 productId) {
        productId = _nextProductId++;

        _products[productId] = Product({
            name: name,
            originator: msg.sender,
            currentHolder: msg.sender,
            registeredAt: block.timestamp,
            recalled: false
        });

        _appendEvent(productId, EventType.Registered, msg.sender, address(0), msg.sender, location, note);

        emit ProductRegistered(productId, msg.sender, name);
    }

    /// @notice Hands custody of a product to another participant. Only the
    /// current holder can initiate a transfer, mirroring a real handoff.
    function transferCustody(
        uint256 productId,
        address to,
        string calldata location,
        string calldata note
    ) external onlyParticipant whenNotPaused nonReentrant {
        Product storage product = _products[productId];
        require(product.registeredAt != 0, "SupplyChain: product does not exist");
        require(!product.recalled, "SupplyChain: product recalled");
        require(product.currentHolder == msg.sender, "SupplyChain: caller does not hold custody");
        require(isParticipant[to], "SupplyChain: recipient is not a participant");

        address from = product.currentHolder;
        product.currentHolder = to;

        _appendEvent(productId, EventType.Transferred, msg.sender, from, to, location, note);

        emit CustodyTransferred(productId, from, to);
    }

    /// @notice Records a checkpoint (inspection, certification, delivery)
    /// against a product without changing custody — e.g. a third-party
    /// inspector logging a quality check.
    function recordCheckpoint(
        uint256 productId,
        EventType eventType,
        string calldata location,
        string calldata note
    ) external onlyParticipant whenNotPaused nonReentrant {
        Product storage product = _products[productId];
        require(product.registeredAt != 0, "SupplyChain: product does not exist");
        require(!product.recalled, "SupplyChain: product recalled");
        require(
            eventType == EventType.Inspected ||
                eventType == EventType.Certified ||
                eventType == EventType.Delivered,
            "SupplyChain: invalid checkpoint type"
        );

        _appendEvent(productId, eventType, msg.sender, address(0), address(0), location, note);

        emit CheckpointRecorded(productId, eventType, msg.sender);
    }

    /// @notice Owner-only. Flags a product as recalled (counterfeit found,
    /// safety issue, etc.). The full history stays on-chain as a record;
    /// no further custody transfers or checkpoints are accepted afterward.
    function recall(uint256 productId, string calldata reason) external onlyOwner {
        Product storage product = _products[productId];
        require(product.registeredAt != 0, "SupplyChain: product does not exist");
        require(!product.recalled, "SupplyChain: already recalled");

        product.recalled = true;

        _appendEvent(productId, EventType.Recalled, msg.sender, address(0), address(0), "", reason);

        emit ProductRecalled(productId, reason);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        return _products[productId];
    }

    function getHistory(uint256 productId) external view returns (CheckpointEvent[] memory) {
        return _history[productId];
    }

    function getHistoryLength(uint256 productId) external view returns (uint256) {
        return _history[productId].length;
    }

    function totalProducts() external view returns (uint256) {
        return _nextProductId - 1;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _appendEvent(
        uint256 productId,
        EventType eventType,
        address actor,
        address from,
        address to,
        string memory location,
        string memory note
    ) private {
        _history[productId].push(
            CheckpointEvent({
                eventType: eventType,
                actor: actor,
                from: from,
                to: to,
                location: location,
                note: note,
                timestamp: block.timestamp
            })
        );
    }
}
