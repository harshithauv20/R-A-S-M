"use client";

import { useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Address } from "viem";
import { deployments } from "proofbox-shared";
import { mstMainnet } from "@/lib/chains";

type DeployedContract = { address: Address; abi: readonly unknown[] };

export const EVENT_TYPES = [
  "Registered",
  "Transferred",
  "Inspected",
  "Certified",
  "Delivered",
  "Recalled",
] as const;
export type EventTypeName = (typeof EVENT_TYPES)[number];

export type Product = {
  name: string;
  originator: Address;
  currentHolder: Address;
  registeredAt: bigint;
  recalled: boolean;
};

export type CheckpointEvent = {
  eventType: number;
  actor: Address;
  from: Address;
  to: Address;
  location: string;
  note: string;
  timestamp: bigint;
};

/**
 * Logs a failed read with enough context to tell a bad deployment/ABI
 * apart from a network problem — e.g. "Failed to fetch" / "NetworkError"
 * almost always means the RPC request itself never got a response (wrong
 * network, RPC down, or blocked by CORS), not a contract-level revert.
 */
function useLogReadError(
  label: string,
  error: Error | null,
  contractAddress: Address | undefined,
  network: string,
) {
  useEffect(() => {
    if (!error) return;
    const looksLikeNetworkFailure = /failed to fetch|networkerror|cors/i.test(error.message);
    console.error(
      `[useSupplyChain] ${label} read failed${looksLikeNetworkFailure ? " (looks like a network/CORS issue, not a contract error — check the Network tab for a blocked/failed request)" : ""}:`,
      error,
      { contractAddress, network },
    );
  }, [label, error, contractAddress, network]);
}

function useSupplyChainContract(): DeployedContract | undefined {
  const { chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  return (deployments as Record<string, any>)[network]?.SupplyChain as
    | DeployedContract
    | undefined;
}

/**
 * Reads/writes for the SupplyChain registry. `productId` is optional —
 * pass it to also resolve that product's details and full checkpoint
 * history (used by the public /track/[productId] page, which works
 * without a connected wallet since these are all plain contract reads).
 */
export function useSupplyChain(productId?: bigint) {
  const { address: connectedAddress, chainId } = useAccount();
  const network = chainId === mstMainnet.id ? "mainnet" : "testnet";
  const contract = useSupplyChainContract();
  const enabled = Boolean(contract);
  const base = contract
    ? { address: contract.address, abi: contract.abi }
    : { address: undefined, abi: undefined };

  const {
    data: owner,
    isLoading: isOwnerLoading,
    isError: isOwnerError,
    error: ownerError,
  } = useReadContract({ ...base, functionName: "owner", query: { enabled } });
  useLogReadError("owner()", ownerError, contract?.address, network);

  const {
    data: isConnectedWalletParticipant,
    isLoading: isParticipantLoading,
    isError: isParticipantError,
    error: participantError,
    refetch: refetchIsParticipant,
  } = useReadContract({
    ...base,
    functionName: "isParticipant",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: { enabled: enabled && Boolean(connectedAddress) },
  });
  useLogReadError("isParticipant()", participantError, contract?.address, network);

  const {
    data: totalProducts,
    isLoading: isTotalProductsLoading,
    isError: isTotalProductsError,
    error: totalProductsError,
    refetch: refetchTotalProducts,
  } = useReadContract({ ...base, functionName: "totalProducts", query: { enabled } });
  useLogReadError("totalProducts()", totalProductsError, contract?.address, network);

  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
    error: productError,
    refetch: refetchProduct,
  } = useReadContract({
    ...base,
    functionName: "getProduct",
    args: productId !== undefined ? [productId] : undefined,
    query: { enabled: enabled && productId !== undefined },
  });
  useLogReadError("getProduct()", productError, contract?.address, network);

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useReadContract({
    ...base,
    functionName: "getHistory",
    args: productId !== undefined ? [productId] : undefined,
    query: { enabled: enabled && productId !== undefined },
  });
  useLogReadError("getHistory()", historyError, contract?.address, network);

  const product = productData as Product | undefined;
  const history = historyData as CheckpointEvent[] | undefined;

  const {
    data: writeData,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: writeData });

  const setParticipant = (account: Address, allowed: boolean) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "setParticipant",
      args: [account, allowed],
    });
  };

  const registerProduct = (name: string, location: string, note: string) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "registerProduct",
      args: [name, location, note],
    });
  };

  const transferCustody = (
    targetProductId: bigint,
    to: Address,
    location: string,
    note: string,
  ) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "transferCustody",
      args: [targetProductId, to, location, note],
    });
  };

  const recordCheckpoint = (
    targetProductId: bigint,
    eventType: number,
    location: string,
    note: string,
  ) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "recordCheckpoint",
      args: [targetProductId, eventType, location, note],
    });
  };

  const recall = (targetProductId: bigint, reason: string) => {
    if (!contract) return;
    writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "recall",
      args: [targetProductId, reason],
    });
  };

  return {
    address: contract?.address,
    isDeployed: enabled,

    owner,
    isConnectedWalletParticipant,
    totalProducts,
    product,
    history,

    isOwnerLoading,
    isOwnerError,
    isParticipantLoading,
    isParticipantError,
    isTotalProductsLoading,
    isTotalProductsError,
    isProductLoading,
    isProductError,
    isHistoryLoading,
    isHistoryError,

    setParticipant,
    registerProduct,
    transferCustody,
    recordCheckpoint,
    recall,

    writeData,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,

    refetchIsParticipant,
    refetchTotalProducts,
    refetchProduct,
    refetchHistory,
  };
}
