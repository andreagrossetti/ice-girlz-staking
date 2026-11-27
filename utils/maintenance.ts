// Staking maintenance mode.
// The FROST minter permission was removed from the staking contract while a fixed
// contract is prepared, so claim (and unstake, which calls claim) revert on-chain.
// While paused the staking page hides every action and shows a notice instead.
// Set NEXT_PUBLIC_STAKING_PAUSED=false to turn it off (e.g. on staging).
export const STAKING_PAUSED = process.env.NEXT_PUBLIC_STAKING_PAUSED !== "false";
