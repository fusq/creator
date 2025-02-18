"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Image from "next/image";

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
    const intervalId = setInterval(getBalance, 10000);

    return () => clearInterval(intervalId);
  }, [publicKey, connection, connected]);

  if (!connected || !publicKey) return null;
  if (error) return null;
  if (balance === null) return null;

  return (
    <div className="mr-4 sm:px-4 py-1 bg-neutral-800 text-neutral-300 rounded-md text-sm sm:h-12 flex items-center gap-2">
      <span>{balance.toFixed(2)}</span>
      <div className="w-4 h-4 relative">
        <Image
          src="/solana-sol-logo.svg"
          alt="SOL"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
};
