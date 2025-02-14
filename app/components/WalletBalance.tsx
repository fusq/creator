"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const WalletBalance = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getBalance() {
      if (!publicKey || !connected) {
        setBalance(null);
        setError(null);
        return;
      }

      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch balance:", e);
        setError("Failed to fetch balance");
        setBalance(null);
      }
    }

    getBalance();
    const intervalId = setInterval(getBalance, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, [publicKey, connection, connected]);

  if (!connected || !publicKey) return null;
  if (error) return null;
  if (balance === null) return null;

  return (
    <span className="mr-2 px-4 py-1 bg-gray-200 text-neutral-900 rounded-md text-sm h-12 flex items-center">
      {balance.toFixed(2)} SOL
    </span>
  );
};
