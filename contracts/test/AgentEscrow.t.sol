// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AgentEscrow} from "../AgentEscrow.sol";

contract AgentEscrowTest is Test {
    AgentEscrow internal escrow;

    address internal buyer  = makeAddr("buyer");
    address internal worker = makeAddr("worker");
    address internal stranger = makeAddr("stranger");

    // A fixed jobId used in most tests.
    bytes32 internal constant JOB_ID = keccak256("job-001");
    bytes32 internal constant PROOF   = keccak256("proof-hash");

    uint256 internal constant AMOUNT = 1 ether; // native USDC (18 dec)
    uint64  internal constant DEADLINE_OFFSET = 1 days;

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------

    /// Deploy a fresh escrow and fund buyer with ETH/native USDC.
    function setUp() public {
        escrow = new AgentEscrow();
        vm.deal(buyer,    10 ether);
        vm.deal(worker,   1  ether);
        vm.deal(stranger, 1  ether);
    }

    /// Create the default job from buyer.
    function _createJob() internal returns (uint64 deadline) {
        deadline = uint64(block.timestamp + DEADLINE_OFFSET);
        vm.prank(buyer);
        escrow.createJob{value: AMOUNT}(JOB_ID, worker, deadline);
    }

    /// Create job + submit proof from worker.
    function _createAndSubmitProof() internal returns (uint64 deadline) {
        deadline = _createJob();
        vm.prank(worker);
        escrow.submitProof(JOB_ID, PROOF);
    }

    // ============================================================
    // 1. Happy path: createJob → submitProof → release
    // ============================================================

    function test_HappyPath_JobCreated_Event() public {
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(buyer);
        vm.expectEmit(true, true, true, true, address(escrow));
        emit AgentEscrow.JobCreated(JOB_ID, buyer, worker, AMOUNT, deadline);
        escrow.createJob{value: AMOUNT}(JOB_ID, worker, deadline);
    }

    function test_HappyPath_ProofSubmitted_Event() public {
        _createJob();

        vm.prank(worker);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit AgentEscrow.ProofSubmitted(JOB_ID, worker, PROOF);
        escrow.submitProof(JOB_ID, PROOF);
    }

    function test_HappyPath_Release_StatusIsReleased() public {
        _createAndSubmitProof();

        vm.prank(buyer);
        escrow.release(JOB_ID);

        (, , , , , AgentEscrow.JobStatus status) = escrow.getJob(JOB_ID);
        assertEq(uint8(status), uint8(AgentEscrow.JobStatus.Released));
    }

    function test_HappyPath_Release_WorkerReceivesCorrectAmount() public {
        _createAndSubmitProof();

        uint256 workerBefore = worker.balance;

        vm.prank(buyer);
        escrow.release(JOB_ID);

        assertEq(worker.balance - workerBefore, AMOUNT);
    }

    function test_HappyPath_Release_PaymentReleased_Event() public {
        _createAndSubmitProof();

        vm.prank(buyer);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit AgentEscrow.PaymentReleased(JOB_ID, worker, AMOUNT);
        escrow.release(JOB_ID);
    }

    // ============================================================
    // 2. Buyer can release without submitProof (Funded state)
    // ============================================================

    function test_Release_FromFundedState_WithoutProof() public {
        _createJob();

        uint256 workerBefore = worker.balance;

        vm.prank(buyer);
        escrow.release(JOB_ID);

        (, , , , , AgentEscrow.JobStatus status) = escrow.getJob(JOB_ID);
        assertEq(uint8(status), uint8(AgentEscrow.JobStatus.Released));
        assertEq(worker.balance - workerBefore, AMOUNT);
    }

    // ============================================================
    // 3. Refund after deadline (buyer calls)
    // ============================================================

    function test_Refund_AfterDeadline_ByBuyer_StatusIsRefunded() public {
        uint64 deadline = _createJob();
        vm.warp(uint256(deadline) + 1);

        vm.prank(buyer);
        escrow.refund(JOB_ID);

        (, , , , , AgentEscrow.JobStatus status) = escrow.getJob(JOB_ID);
        assertEq(uint8(status), uint8(AgentEscrow.JobStatus.Refunded));
    }

    function test_Refund_AfterDeadline_ByBuyer_BuyerReceivesAmount() public {
        uint64 deadline = _createJob();
        vm.warp(uint256(deadline) + 1);

        uint256 buyerBefore = buyer.balance;

        vm.prank(buyer);
        escrow.refund(JOB_ID);

        assertEq(buyer.balance - buyerBefore, AMOUNT);
    }

    function test_Refund_AfterDeadline_ByBuyer_JobRefunded_Event() public {
        uint64 deadline = _createJob();
        vm.warp(uint256(deadline) + 1);

        vm.prank(buyer);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit AgentEscrow.JobRefunded(JOB_ID, buyer, AMOUNT);
        escrow.refund(JOB_ID);
    }

    // ============================================================
    // 4. Worker can also call refund after deadline
    // ============================================================

    function test_Refund_AfterDeadline_ByWorker_Succeeds() public {
        uint64 deadline = _createJob();
        vm.warp(uint256(deadline) + 1);

        uint256 buyerBefore = buyer.balance;

        vm.prank(worker);
        escrow.refund(JOB_ID);

        (, , , , , AgentEscrow.JobStatus status) = escrow.getJob(JOB_ID);
        assertEq(uint8(status), uint8(AgentEscrow.JobStatus.Refunded));
        // Funds go to buyer regardless of who triggered the refund.
        assertEq(buyer.balance - buyerBefore, AMOUNT);
    }

    // ============================================================
    // 5. Access-control revert tests
    // ============================================================

    // --- submitProof by non-worker ---
    function test_Revert_SubmitProof_ByNonWorker() public {
        _createJob();

        vm.prank(stranger);
        vm.expectRevert(AgentEscrow.NotWorker.selector);
        escrow.submitProof(JOB_ID, PROOF);
    }

    // submitProof by buyer (also non-worker)
    function test_Revert_SubmitProof_ByBuyer() public {
        _createJob();

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.NotWorker.selector);
        escrow.submitProof(JOB_ID, PROOF);
    }

    // --- release by non-buyer ---
    function test_Revert_Release_ByNonBuyer() public {
        _createJob();

        vm.prank(stranger);
        vm.expectRevert(AgentEscrow.NotBuyer.selector);
        escrow.release(JOB_ID);
    }

    function test_Revert_Release_ByWorker() public {
        _createJob();

        vm.prank(worker);
        vm.expectRevert(AgentEscrow.NotBuyer.selector);
        escrow.release(JOB_ID);
    }

    // --- refund before deadline ---
    function test_Revert_Refund_BeforeDeadline_ByBuyer() public {
        _createJob();

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.DeadlineNotPassed.selector);
        escrow.refund(JOB_ID);
    }

    // --- refund by unrelated address (not buyer, not worker) ---
    // The contract checks: if (msg.sender != buyer && msg.sender != worker) revert InvalidStatus()
    function test_Revert_Refund_ByUnrelatedAddress() public {
        uint64 deadline = _createJob();
        vm.warp(uint256(deadline) + 1);

        vm.prank(stranger);
        vm.expectRevert(AgentEscrow.InvalidStatus.selector);
        escrow.refund(JOB_ID);
    }

    // --- createJob: deadline in the past ---
    function test_Revert_CreateJob_DeadlineInPast() public {
        // deadline == block.timestamp is also invalid (requires strictly >)
        uint64 badDeadline = uint64(block.timestamp);

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.InvalidDeadline.selector);
        escrow.createJob{value: AMOUNT}(JOB_ID, worker, badDeadline);
    }

    function test_Revert_CreateJob_DeadlineStrictlyInPast() public {
        vm.warp(1000);
        uint64 badDeadline = uint64(block.timestamp - 1);

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.InvalidDeadline.selector);
        escrow.createJob{value: AMOUNT}(JOB_ID, worker, badDeadline);
    }

    // --- createJob: zero amount ---
    function test_Revert_CreateJob_ZeroAmount() public {
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.InvalidAmount.selector);
        escrow.createJob{value: 0}(JOB_ID, worker, deadline);
    }

    // --- createJob: zero-address worker ---
    function test_Revert_CreateJob_ZeroAddressWorker() public {
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.InvalidWorker.selector);
        escrow.createJob{value: AMOUNT}(JOB_ID, address(0), deadline);
    }

    // --- submitProof: zero deliverable hash ---
    function test_Revert_SubmitProof_ZeroHash() public {
        _createJob();

        vm.prank(worker);
        vm.expectRevert(AgentEscrow.InvalidDeliverableHash.selector);
        escrow.submitProof(JOB_ID, bytes32(0));
    }

    // --- double-createJob: same jobId ---
    function test_Revert_CreateJob_DuplicateJobId() public {
        _createJob();

        uint64 deadline2 = uint64(block.timestamp + 2 * DEADLINE_OFFSET);
        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.JobAlreadyExists.selector);
        escrow.createJob{value: AMOUNT}(JOB_ID, worker, deadline2);
    }

    // --- release on already-released job ---
    function test_Revert_Release_AlreadyReleased() public {
        _createJob();
        vm.prank(buyer);
        escrow.release(JOB_ID);

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.InvalidStatus.selector);
        escrow.release(JOB_ID);
    }

    // --- refund on already-released job ---
    function test_Revert_Refund_AlreadyReleased() public {
        uint64 deadline = _createJob();
        vm.prank(buyer);
        escrow.release(JOB_ID);

        vm.warp(uint256(deadline) + 1);

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.InvalidStatus.selector);
        escrow.refund(JOB_ID);
    }

    // --- refund on already-refunded job ---
    function test_Revert_Refund_AlreadyRefunded() public {
        uint64 deadline = _createJob();
        vm.warp(uint256(deadline) + 1);

        vm.prank(buyer);
        escrow.refund(JOB_ID);

        vm.prank(buyer);
        vm.expectRevert(AgentEscrow.InvalidStatus.selector);
        escrow.refund(JOB_ID);
    }

    // ============================================================
    // 6. getJob view: verify all fields returned correctly
    // ============================================================

    function test_GetJob_FieldsAfterCreate() public {
        uint64 deadline = _createJob();

        (
            address retBuyer,
            address retWorker,
            uint256 retAmount,
            uint64  retDeadline,
            bytes32 retHash,
            AgentEscrow.JobStatus retStatus
        ) = escrow.getJob(JOB_ID);

        assertEq(retBuyer,            buyer);
        assertEq(retWorker,           worker);
        assertEq(retAmount,           AMOUNT);
        assertEq(retDeadline,         deadline);
        assertEq(retHash,             bytes32(0));
        assertEq(uint8(retStatus),    uint8(AgentEscrow.JobStatus.Funded));
    }

    function test_GetJob_FieldsAfterSubmitProof() public {
        _createAndSubmitProof();

        (
            ,
            ,
            ,
            ,
            bytes32 retHash,
            AgentEscrow.JobStatus retStatus
        ) = escrow.getJob(JOB_ID);

        assertEq(retHash,          PROOF);
        assertEq(uint8(retStatus), uint8(AgentEscrow.JobStatus.ProofSubmitted));
    }

    function test_GetJob_NonExistentJob_ReturnsDefaults() public view {
        (
            address retBuyer,
            address retWorker,
            uint256 retAmount,
            uint64  retDeadline,
            bytes32 retHash,
            AgentEscrow.JobStatus retStatus
        ) = escrow.getJob(keccak256("nonexistent"));

        assertEq(retBuyer,         address(0));
        assertEq(retWorker,        address(0));
        assertEq(retAmount,        0);
        assertEq(retDeadline,      0);
        assertEq(retHash,          bytes32(0));
        assertEq(uint8(retStatus), uint8(AgentEscrow.JobStatus.None));
    }

    // ============================================================
    // 7. Fuzz: createJob with varied amounts and deadlines
    // ============================================================

    function testFuzz_CreateJob_VariedAmountAndDeadline(
        uint96 amount,
        uint32 offsetSeconds
    ) public {
        amount        = uint96(bound(amount,        1,       100 ether));
        offsetSeconds = uint32(bound(offsetSeconds, 1,       365 days));

        uint64 deadline = uint64(block.timestamp + offsetSeconds);
        bytes32 jobId   = keccak256(abi.encodePacked("fuzz", amount, offsetSeconds));

        address fuzzyBuyer  = makeAddr("fuzzyBuyer");
        address fuzzyWorker = makeAddr("fuzzyWorker");
        vm.deal(fuzzyBuyer, uint256(amount));

        vm.prank(fuzzyBuyer);
        escrow.createJob{value: uint256(amount)}(jobId, fuzzyWorker, deadline);

        (
            address retBuyer,
            address retWorker,
            uint256 retAmount,
            uint64  retDeadline,
            bytes32 retHash,
            AgentEscrow.JobStatus retStatus
        ) = escrow.getJob(jobId);

        assertEq(retBuyer,         fuzzyBuyer);
        assertEq(retWorker,        fuzzyWorker);
        assertEq(retAmount,        uint256(amount));
        assertEq(retDeadline,      deadline);
        assertEq(retHash,          bytes32(0));
        assertEq(uint8(retStatus), uint8(AgentEscrow.JobStatus.Funded));
    }

    // ============================================================
    // 8. Refund with ProofSubmitted status (not just Funded)
    // ============================================================

    function test_Refund_AfterProofSubmitted_ByBuyer() public {
        uint64 deadline = _createAndSubmitProof();
        vm.warp(uint256(deadline) + 1);

        uint256 buyerBefore = buyer.balance;

        vm.prank(buyer);
        escrow.refund(JOB_ID);

        (, , , , , AgentEscrow.JobStatus status) = escrow.getJob(JOB_ID);
        assertEq(uint8(status), uint8(AgentEscrow.JobStatus.Refunded));
        assertEq(buyer.balance - buyerBefore, AMOUNT);
    }

    function test_Refund_AfterProofSubmitted_ByWorker() public {
        uint64 deadline = _createAndSubmitProof();
        vm.warp(uint256(deadline) + 1);

        uint256 buyerBefore = buyer.balance;

        vm.prank(worker);
        escrow.refund(JOB_ID);

        (, , , , , AgentEscrow.JobStatus status) = escrow.getJob(JOB_ID);
        assertEq(uint8(status), uint8(AgentEscrow.JobStatus.Refunded));
        assertEq(buyer.balance - buyerBefore, AMOUNT);
    }

    // ============================================================
    // 9. Release from ProofSubmitted state emits correct event
    // ============================================================

    function test_Release_FromProofSubmitted_State() public {
        _createAndSubmitProof();

        uint256 workerBefore = worker.balance;

        vm.prank(buyer);
        vm.expectEmit(true, true, false, true, address(escrow));
        emit AgentEscrow.PaymentReleased(JOB_ID, worker, AMOUNT);
        escrow.release(JOB_ID);

        assertEq(worker.balance - workerBefore, AMOUNT);
        (, , , , , AgentEscrow.JobStatus status) = escrow.getJob(JOB_ID);
        assertEq(uint8(status), uint8(AgentEscrow.JobStatus.Released));
    }

    // ============================================================
    // 10. Invariant: escrow balance zero after release/refund
    // ============================================================

    function test_Invariant_EscrowBalance_ZeroAfterRelease() public {
        _createJob();
        assertEq(address(escrow).balance, AMOUNT);

        vm.prank(buyer);
        escrow.release(JOB_ID);

        assertEq(address(escrow).balance, 0);
    }

    function test_Invariant_EscrowBalance_ZeroAfterRefund() public {
        uint64 deadline = _createJob();
        assertEq(address(escrow).balance, AMOUNT);

        vm.warp(uint256(deadline) + 1);
        vm.prank(buyer);
        escrow.refund(JOB_ID);

        assertEq(address(escrow).balance, 0);
    }
}
