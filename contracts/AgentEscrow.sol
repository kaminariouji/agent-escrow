// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentEscrow {
    enum JobStatus {
        None,
        Funded,
        ProofSubmitted,
        Released,
        Refunded
    }

    struct Job {
        address buyer;
        address worker;
        uint256 amount;
        uint64 deadline;
        bytes32 deliverableHash;
        JobStatus status;
    }

    mapping(bytes32 => Job) public jobs;
    mapping(address => uint256) public pendingWithdrawals;

    error JobNotFound();
    error NotBuyer();
    error NotWorker();
    error DeadlineNotPassed();
    error DeadlineAlreadyPassed();
    error InvalidStatus();
    error InvalidWorker();
    error InvalidAmount();
    error TransferFailed();
    error JobAlreadyExists();
    error InvalidDeadline();
    error InvalidDeliverableHash();
    error NothingToWithdraw();

    event JobCreated(
        bytes32 indexed jobId,
        address indexed buyer,
        address indexed worker,
        uint256 amount,
        uint64 deadline
    );
    event ProofSubmitted(bytes32 indexed jobId, address indexed worker, bytes32 deliverableHash);
    event PaymentReleased(bytes32 indexed jobId, address indexed worker, uint256 amount);
    event JobRefunded(bytes32 indexed jobId, address indexed buyer, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);

    function createJob(bytes32 jobId, address worker, uint64 deadline) external payable {
        if (worker == address(0)) revert InvalidWorker();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (msg.value == 0) revert InvalidAmount();

        Job storage job = jobs[jobId];
        if (job.status != JobStatus.None) revert JobAlreadyExists();

        job.buyer = msg.sender;
        job.worker = worker;
        job.amount = msg.value;
        job.deadline = deadline;
        job.deliverableHash = bytes32(0);
        job.status = JobStatus.Funded;

        emit JobCreated(jobId, msg.sender, worker, msg.value, deadline);
    }

    function submitProof(bytes32 jobId, bytes32 deliverableHash) external {
        Job storage job = jobs[jobId];
        if (job.status == JobStatus.None) revert JobNotFound();
        if (msg.sender != job.worker) revert NotWorker();
        if (job.status != JobStatus.Funded) revert InvalidStatus();
        if (deliverableHash == bytes32(0)) revert InvalidDeliverableHash();

        job.deliverableHash = deliverableHash;
        job.status = JobStatus.ProofSubmitted;

        emit ProofSubmitted(jobId, msg.sender, deliverableHash);
    }

    function release(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.status == JobStatus.None) revert JobNotFound();
        if (msg.sender != job.buyer) revert NotBuyer();
        if (job.status != JobStatus.Funded && job.status != JobStatus.ProofSubmitted) revert InvalidStatus();

        uint256 amount = job.amount;
        address worker = job.worker;

        job.status = JobStatus.Released;
        pendingWithdrawals[worker] += amount;

        emit PaymentReleased(jobId, worker, amount);
    }

    function refund(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.status == JobStatus.None) revert JobNotFound();
        if (msg.sender != job.buyer && msg.sender != job.worker) revert NotBuyer();
        if (block.timestamp <= job.deadline) revert DeadlineNotPassed();
        if (job.status != JobStatus.Funded) revert InvalidStatus();

        uint256 amount = job.amount;
        address buyer = job.buyer;

        job.status = JobStatus.Refunded;
        pendingWithdrawals[buyer] += amount;

        emit JobRefunded(jobId, buyer, amount);
    }

    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingWithdrawals[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    function getJob(
        bytes32 jobId
    )
        external
        view
        returns (address buyer, address worker, uint256 amount, uint64 deadline, bytes32 deliverableHash, JobStatus status)
    {
        Job storage job = jobs[jobId];
        return (job.buyer, job.worker, job.amount, job.deadline, job.deliverableHash, job.status);
    }
}
