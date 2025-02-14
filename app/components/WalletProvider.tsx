"use client";

import { FC, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { WalletBalance } from "./WalletBalance";
import { TokenCreationForm } from "./TokenCreationForm";

// Import wallet styles
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletProvider: FC = () => {
  // Use Helius RPC endpoint
  const endpoint =
    "https://mainnet.helius-rpc.com/?api-key=3212d845-480e-4b86-af4f-c8150ebb819a";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-100">
            <header className="p-4 flex justify-end items-center">
              <WalletBalance />
              <WalletMultiButton />
            </header>
            <main className="flex flex-col items-center justify-center px-4 pt-16">
              <h1 className="text-4xl font-bold mb-12 text-neutral-900">
                Wallet Dashboard
              </h1>
              <TokenCreationForm />
            </main>
          </div>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
