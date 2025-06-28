# Myron Will

## Overview
`Myron Will` is an Ethereum-based smart contract for managing digital wills. It allows users to create wills, assign beneficiaries, deposit ETH, and automate fund distribution after a specified inactivity period using Chainlink Automation. A 1.1% fee is deducted during distribution.

## Features
- Create and manage multiple wills per user.
- Set beneficiaries with percentage-based allocations (totaling 100%).
- Deposit and withdraw ETH from wills.
- Automate fund distribution via Chainlink Automation if the owner is inactive.
- Activate or deactivate wills.
- Transparent event logging for all actions.

## How It Works
1. **Register**: Create a will with an inactivity period (e.g., 30 days).
2. **Deposit Funds**: Add ETH to a will using `depositFunds`.
3. **Set Beneficiaries**: Assign beneficiaries and their allocations.
4. **Check-In**: Periodically check in to reset the inactivity timer.
5. **Automation**: Chainlink Automation distributes funds to beneficiaries if the inactivity period is exceeded.
6. **Withdraw/Deactivate**: Owners can withdraw funds or deactivate wills.

## Key Functions
- `register(uint256 _inactivityPeriod)`: Creates a new will.
- `checkIn(uint256 willId)`: Resets the inactivity timer.
- `updateBeneficiaries(uint256 willId, address payable[] _beneficiaries, uint256[] _allocations)`: Updates beneficiaries and allocations.
- `depositFunds(uint256 willId)`: Deposits ETH into a will.
- `withdraw(uint256 willId)`: Withdraws all funds and deactivates the will.
- `deactivateWill(uint256 willId)`: Deactivates a will.
- `activateWill(uint256 willId)`: Reactivates a will.
- `executeTransfer(address userAddress, uint256 willId)`: Distributes funds to beneficiaries (1.1% fee applied).

## Chainlink Automation
- `checkUpkeep(bytes)`: Identifies wills past their inactivity period.
- `checkUpkeepPaginated(uint256 startIndex, uint256 endIndex)`: Paginated check for large user bases.
- `performUpkeep(bytes)`: Executes fund distribution for expired wills.

## View Functions
- `getWillStatus(address owner, uint256 willId)`: Returns will details (last check-in, balance, etc.).
- `getBeneficiaries(address owner, uint256 willId)`: Lists beneficiaries.
- `getBeneficiaryAllocation(address owner, uint256 willId, address beneficiary)`: Returns a beneficiary’s allocation.
- `getRemainingTime(address owner, uint256 willId)`: Time until a will becomes executable.

## Security
- `onlyWillOwner` modifier restricts actions to will owners.
- `onlyAdmin` modifier limits fee receiver updates.
- Validates allocations sum to 100%.
- Uses `call` for safe ETH transfers.
- Gas-optimized with `assembly` for array resizing.

## Deployment
- **Solidity**: `^0.8.19`
- **Dependency**: Chainlink Automation (`@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol`)
- **Constructor**: Requires a `feeReceiver` address.

## Usage Example
1. Deploy with a `feeReceiver` address.
2. Call `register(2592000)` for a 30-day inactivity period.
3. Deposit ETH with `depositFunds(1)`.
4. Set beneficiaries: `updateBeneficiaries(1, [addr1, addr2], [50, 50])`.
5. Check in periodically with `checkIn(1)`.
6. Chainlink Automation handles distribution if inactive.

## Events
- `Registered`: New will created.
- `CheckIn`: Owner checks in.
- `BeneficiariesUpdated`: Beneficiaries updated.
- `Deposited`: ETH deposited.
- `Withdrawn`: Funds withdrawn.
- `FundsDistributed`: Funds sent to beneficiaries.
- `WillActivated`/`WillDeactivated`: Will status changed.
- `FeeReceiverUpdated`: Fee receiver changed.

## Notes
- 1.1% fee is sent to `feeReceiver` during distribution.
- Ensure Chainlink Automation is configured for `checkUpkeep` and `performUpkeep`.
- The `receive` function allows direct ETH deposits to the latest will.

## License
MIT License