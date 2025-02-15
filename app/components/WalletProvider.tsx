"use client";

import { FC, useMemo } from "react";
import GuideFaq from "./GuideFaq";
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
const WalletProvider: FC = () => {
  // Use Helius RPC endpoint
  const endpoint =
    "https://mainnet.helius-rpc.com/?api-key=3212d845-480e-4b86-af4f-c8150ebb819a";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <style jsx global>{`
            @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap");
            @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap");
            .wallet-adapter-button {
              background-color: transparent;
              border: none;
              color: #fff;
              cursor: pointer;
              display: flex;
              align-items: center;
              font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica,
                Arial, sans-serif;
              font-size: 16px;
              font-weight: 600;
              height: 48px;
              line-height: 48px;
              padding: 0 24px;
              border-radius: 4px;
            }

            .wallet-adapter-button-trigger {
              background-color: #512da8;
            }

            .wallet-adapter-button:not([disabled]):focus-visible {
              outline-color: white;
            }

            .wallet-adapter-button:not([disabled]):hover {
              background-color: #1a1f2e;
            }

            .wallet-adapter-button[disabled] {
              background: #404144;
              color: #999;
              cursor: not-allowed;
            }

            .wallet-adapter-button-end-icon,
            .wallet-adapter-button-start-icon,
            .wallet-adapter-button-end-icon img,
            .wallet-adapter-button-start-icon img {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
            }

            .wallet-adapter-button-end-icon {
              margin-left: 12px;
            }

            .wallet-adapter-button-start-icon {
              margin-right: 12px;
            }

            .wallet-adapter-collapse {
              width: 100%;
            }

            .montserrat {
              font-family: "Montserrat", "Roboto", "Helvetica Neue", Helvetica,
                Arial, sans-serif;
            }

            .wallet-adapter-dropdown {
              position: relative;
              display: inline-block;
            }

            .wallet-adapter-dropdown-list {
              position: absolute;
              z-index: 99;
              display: grid;
              grid-template-rows: 1fr;
              grid-row-gap: 10px;
              padding: 10px;
              top: 100%;
              right: 0;
              margin: 0;
              list-style: none;
              background: #2c2d30;
              border-radius: 10px;
              box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.6);
              opacity: 0;
              visibility: hidden;
              transition: opacity 200ms ease, transform 200ms ease,
                visibility 200ms;
              font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica,
                Arial, sans-serif;
            }

            .wallet-adapter-dropdown-list-active {
              opacity: 1;
              visibility: visible;
              transform: translateY(10px);
            }

            .wallet-adapter-dropdown-list-item {
              display: flex;
              flex-direction: row;
              justify-content: center;
              align-items: center;
              border: none;
              outline: none;
              cursor: pointer;
              white-space: nowrap;
              box-sizing: border-box;
              padding: 0 20px;
              width: 100%;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              height: 37px;
              color: #fff;
            }

            .wallet-adapter-dropdown-list-item:not([disabled]):hover {
              background-color: #1a1f2e;
            }

            .wallet-adapter-modal-collapse-button svg {
              align-self: center;
              fill: #999;
            }

            .wallet-adapter-modal-collapse-button.wallet-adapter-modal-collapse-button-active
              svg {
              transform: rotate(180deg);
              transition: transform ease-in 150ms;
            }

            .wallet-adapter-modal {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              opacity: 0;
              transition: opacity linear 150ms;
              background: rgba(0, 0, 0, 0.5);
              z-index: 1040;
              overflow-y: auto;
            }

            .wallet-adapter-modal.wallet-adapter-modal-fade-in {
              opacity: 1;
            }

            .wallet-adapter-modal-button-close {
              display: flex;
              align-items: center;
              justify-content: center;
              position: absolute;
              top: 18px;
              right: 18px;
              padding: 12px;
              cursor: pointer;
              background: #1a1f2e;
              border: none;
              border-radius: 50%;
            }

            .wallet-adapter-modal-button-close:focus-visible {
              outline-color: white;
            }

            .wallet-adapter-modal-button-close svg {
              fill: #777;
              transition: fill 200ms ease 0s;
            }

            .wallet-adapter-modal-button-close:hover svg {
              fill: #fff;
            }

            .wallet-adapter-modal-overlay {
              background: rgba(0, 0, 0, 0.5);
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
            }

            .wallet-adapter-modal-container {
              display: flex;
              margin: 3rem;
              min-height: calc(100vh - 6rem); /* 100vh - 2 * margin */
              align-items: center;
              justify-content: center;
            }

            @media (max-width: 480px) {
              .wallet-adapter-modal-container {
                margin: 1rem;
                min-height: calc(100vh - 2rem); /* 100vh - 2 * margin */
              }
            }

            .wallet-adapter-modal-wrapper {
              box-sizing: border-box;
              position: relative;
              display: flex;
              align-items: center;
              flex-direction: column;
              z-index: 1050;
              max-width: 400px;
              border-radius: 10px;
              background: #10141f;
              box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.6);
              font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica,
                Arial, sans-serif;
              flex: 1;
            }

            .wallet-adapter-modal-wrapper .wallet-adapter-button {
              width: 100%;
            }

            .wallet-adapter-modal-title {
              font-weight: 500;
              font-size: 24px;
              line-height: 36px;
              margin: 0;
              padding: 64px 48px 48px 48px;
              text-align: center;
              color: #fff;
            }

            @media (max-width: 374px) {
              .wallet-adapter-modal-title {
                font-size: 18px;
              }
            }

            .wallet-adapter-modal-list {
              margin: 0 0 12px 0;
              padding: 0;
              width: 100%;
              list-style: none;
            }

            .wallet-adapter-modal-list .wallet-adapter-button {
              font-weight: 400;
              border-radius: 0;
              font-size: 18px;
            }

            .wallet-adapter-modal-list .wallet-adapter-button-end-icon,
            .wallet-adapter-modal-list .wallet-adapter-button-start-icon,
            .wallet-adapter-modal-list .wallet-adapter-button-end-icon img,
            .wallet-adapter-modal-list .wallet-adapter-button-start-icon img {
              width: 28px;
              height: 28px;
            }

            .wallet-adapter-modal-list .wallet-adapter-button span {
              margin-left: auto;
              font-size: 14px;
              opacity: 0.6;
            }

            .wallet-adapter-modal-list-more {
              cursor: pointer;
              border: none;
              padding: 12px 24px 24px 12px;
              align-self: flex-end;
              display: flex;
              align-items: center;
              background-color: transparent;
              color: #fff;
            }

            .wallet-adapter-modal-list-more svg {
              transition: all 0.1s ease;
              fill: rgba(255, 255, 255, 1);
              margin-left: 0.5rem;
            }

            .wallet-adapter-modal-list-more-icon-rotate {
              transform: rotate(180deg);
            }

            .wallet-adapter-modal-middle {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 0 24px 24px 24px;
              box-sizing: border-box;
            }

            .wallet-adapter-modal-middle-button {
              display: block;
              cursor: pointer;
              margin-top: 48px;
              width: 100%;
              background-color: #512da8;
              padding: 12px;
              font-size: 18px;
              border: none;
              border-radius: 8px;
              color: #fff;
            }
          `}</style>
          <div className="min-h-screen bg-neutral-900">
            {/* Announcement Banner */}
            <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium">
              CREATE YOUR TOKEN FOR ONLY 0.1 SOL UNTIL FEB 28TH
            </div>

            {/* Header */}
            <header className="p-4 border-b border-neutral-800 relative">
              <div className="flex justify-between items-center max-w-7xl mx-auto">
                {/* Website Name */}
                <div className="text-2xl font-bold montserrat text-white">
                  Coin
                  <span className="text-indigo-400 font-medium">
                    Builder.io
                  </span>
                </div>

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
              <h1 className="text-4xl font-bold mb-2 text-white bg-indigo-600 px-4 py-2 rounded-lg">
                Create Your Own Token FAST ⚡
              </h1>
              <p className="text-lg text-neutral-400">
                Launch your own token on Solana in seconds. No coding required.
              </p>
              <TokenCreationForm />

              <GuideFaq />

              {/* Footer */}
              <footer className="w-full bg-neutral-800 border-t border-neutral-700 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4">
                  <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                    CoinBuilder.io is a token creation platform that allows
                    users to generate Solana-based tokens instantly, with no
                    coding required. CoinBuilder.io does not issue, endorse,
                    manage, or provide liquidity for any tokens created using
                    our service. We do not provide financial advice, investment
                    recommendations, or guarantees of value, price, or returns
                    on any tokens. Tokens created on CoinBuilder.io are not
                    securities, and users are solely responsible for ensuring
                    compliance with applicable laws and regulations in their
                    jurisdiction. CoinBuilder.io does not facilitate token
                    trading, fundraising, or liquidity provision. By using
                    CoinBuilder.io, you acknowledge that creating and trading
                    tokens carry significant risks, including loss of funds,
                    market volatility, and regulatory uncertainty.
                    CoinBuilder.io is provided &quot;as is&quot; without
                    warranties of any kind. We are not responsible for any
                    outcomes related to the use of our platform. By using
                    CoinBuilder.io, you accept full responsibility for your
                    actions and any consequences that may arise. Always conduct
                    your own due diligence before engaging with any token or
                    project.
                  </p>
                  <div className="text-sm text-neutral-500 flex flex-wrap items-center justify-between">
                    <span>© 2025 CoinBuilder.io | All Rights Reserved</span>
                    <div className="items-center space-x-4 hidden">
                      <a
                        href="https://t.me/coinbuilderio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-300"
                      >
                        Support on Telegram @coinbuilderio
                      </a>
                      <span>|</span>
                      <a href="#" className="hover:text-neutral-300">
                        Become an affiliate for CoinBuilder.io
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
