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

const WalletProvider: FC<{ children: React.ReactNode }> = ({}) => {
  // Use Helius RPC endpoint
  const endpoint =
    "https://mainnet.helius-rpc.com/?api-key=3212d845-480e-4b86-af4f-c8150ebb819a";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-neutral-900">
            {/* Announcement Banner */}
            <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium">
              CREATE YOUR TOKEN FOR ONLY 0.1 SOL UNTIL FEB 28TH
            </div>

            {/* Header */}
            <header className="p-4 border-b border-neutral-800 relative">
              <div className="flex justify-between items-center max-w-7xl mx-auto">
                {/* Website Name */}
                <div className="text-2xl font-bold text-white">MemeFast</div>

                {/* Wallet Section */}
                <div className="flex items-center space-x-4">
                  <WalletBalance />
                  <WalletMultiButton />
                </div>
              </div>

              {/* Navigation Menu - Centered */}
              <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex space-x-6">
                  <button className="px-4 py-2 font-medium text-indigo-400 rounded-md hover:text-indigo-700 transition-colors">
                    Create Token
                  </button>
                  <a
                    href="https://raydium.io/liquidity/create-pool/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-neutral-400 font-medium hover:text-indigo-700 transition-colors"
                  >
                    Create Liquidity
                  </a>
                </div>
              </nav>
            </header>

            <main className="flex flex-col items-center justify-center pt-16">
              <TokenCreationForm />

              {/* Footer */}
              <footer className="w-full bg-neutral-800 border-t border-neutral-700 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4">
                  <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                    MemeFast is a token creation platform that allows users to
                    generate Solana-based tokens instantly, with no coding
                    required. MemeFast does not issue, endorse, manage, or
                    provide liquidity for any tokens created using our service.
                    We do not provide financial advice, investment
                    recommendations, or guarantees of value, price, or returns
                    on any tokens. Tokens created on MemeFast are not
                    securities, and users are solely responsible for ensuring
                    compliance with applicable laws and regulations in their
                    jurisdiction. MemeFast does not facilitate token trading,
                    fundraising, or liquidity provision. By using MemeFast, you
                    acknowledge that creating and trading tokens carry
                    significant risks, including loss of funds, market
                    volatility, and regulatory uncertainty. MemeFast is provided
                    &quot;as is&quot; without warranties of any kind. We are not
                    responsible for any outcomes related to the use of our
                    platform. By using MemeFast, you accept full responsibility
                    for your actions and any consequences that may arise. Always
                    conduct your own due diligence before engaging with any
                    token or project.
                  </p>
                  <div className="text-sm text-neutral-500 flex flex-wrap items-center justify-between">
                    <span>© 2025 MemeFast | All Rights Reserved</span>
                    <div className="flex items-center space-x-4">
                      <a
                        href="https://t.me/memefastofficial"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-300"
                      >
                        Support on Telegram @memefastofficial
                      </a>
                      <span>|</span>
                      <a href="#" className="hover:text-neutral-300">
                        Become an affiliate for MemeFast
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
            </main>
          </div>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
