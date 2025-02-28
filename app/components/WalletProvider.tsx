"use client";

import { FC, useMemo, useState } from "react";
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
import Image from "next/image";
import DynamicAnnouncementBanner from "./DynamicAnnouncementBanner";
import { Coins, Droplets, Menu, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const WalletProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use Helius RPC endpoint
  const endpoint =
    "https://mainnet.helius-rpc.com/?api-key=3212d845-480e-4b86-af4f-c8150ebb819a";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const pathname = usePathname();

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <style jsx global>{`
            @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap");
            @import url("https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;400;500;600;700;800;900&display=swap");
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

            .Lexend {
              font-family: "Lexend", "Roboto", "Helvetica Neue", Helvetica,
                Arial, sans-serif;
            }

            .wallet-adapter-dropdown {
              position: relative;
              display: inline-block;
              z-index: 9999;
            }

            .wallet-adapter-dropdown-list {
              position: absolute;
              z-index: 99999;
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
              z-index: 99999;
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
              z-index: 9999;
            }

            .wallet-adapter-dropdown-list-item:not([disabled]):hover {
              background-color: #1a1f2e;
              z-index: 9999;
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
              z-index: 9999;
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
          <div className="min-h-screen bg-neutral-900 text-white relative">
            <header className="p-2 sm:p-4 border-b border-neutral-700 relative z-[50]">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                  {/* Left section with menu, logo and nav */}
                  <div className="flex items-center">
                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="sm:hidden p-2 text-neutral-400 hover:text-white mr-2"
                    >
                      <Menu className="w-6 h-6" />
                    </button>

                    {/* Logo and Navigation Flex Container */}
                    <div className="flex items-center gap-12">
                      {/* Logo */}
                      <div className="flex items-center">
                        <Image
                          src="/memefast.png"
                          alt="MemeFast Logo"
                          className="mr-2 sm:mr-4"
                          width={40}
                          height={40}
                        />
                        <div className="text-lg sm:text-2xl font-bold Lexend text-white">
                          Meme
                          <span className="text-indigo-400 font-medium">
                            Fast
                          </span>
                        </div>
                      </div>

                      {/* Desktop Navigation - Now Next to Logo */}
                      <nav className="hidden sm:flex items-center">
                        <div className="flex space-x-2 sm:space-x-6">
                          <Link
                            href="/create-coin"
                            className={`px-2 sm:px-4 py-2 text-base font-medium rounded-md transition-colors flex items-center gap-2 ${
                              pathname === "/create-coin"
                                ? "text-indigo-500 hover:text-indigo-500"
                                : "text-neutral-400 hover:text-indigo-400"
                            }`}
                          >
                            <Coins className="w-4 h-4" />
                            Create Coin
                          </Link>
                          <Link
                            href="/liquidity"
                            className={`px-2 sm:px-4 py-2 text-base font-medium rounded-md transition-colors flex items-center gap-2 ${
                              pathname === "/liquidity"
                                ? "text-indigo-500 hover:text-indigo-500"
                                : "text-neutral-400 hover:text-indigo-400"
                            }`}
                          >
                            <Droplets className="w-4 h-4" />
                            Manage Liquidity
                          </Link>
                          <Link
                            href="/trending"
                            className={`px-2 sm:px-4 py-2 text-base font-medium rounded-md transition-colors flex items-center gap-2 ${
                              pathname === "/trending"
                                ? "text-indigo-500 hover:text-indigo-500"
                                : "text-neutral-400 hover:text-indigo-400"
                            }`}
                          >
                            <TrendingUp className="w-4 h-4" />
                            Copy Trending Coins
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-green-500 text-white rounded-full">
                              NEW
                            </span>
                          </Link>
                        </div>
                      </nav>
                    </div>
                  </div>

                  {/* Wallet Section - Right */}
                  <div className="flex items-center justify-end">
                    {/* Show balance only on desktop */}
                    <div className="hidden sm:block">
                      <WalletBalance />
                    </div>
                    <div className="scale-90 sm:scale-100 origin-right">
                      <WalletMultiButton />
                    </div>
                  </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                  <div className="sm:hidden absolute top-full left-0 right-0 bg-neutral-900 border-b border-neutral-800 z-50">
                    <div className="p-4 flex flex-col space-y-4">
                      {/* Balance display in mobile menu */}
                      <div className="px-4 py-3 bg-neutral-800 rounded-md">
                        <WalletBalance />
                      </div>

                      <Link
                        href="/create-coin"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-4 py-3 text-base font-medium rounded-md transition-colors flex items-center gap-2 ${
                          pathname === "/create-coin"
                            ? "bg-indigo-600 text-white"
                            : "text-neutral-400 hover:bg-neutral-800"
                        }`}
                      >
                        <Coins className="w-5 h-5" />
                        Create Coin
                      </Link>
                      <Link
                        href="/liquidity"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-4 py-3 text-base font-medium rounded-md transition-colors flex items-center gap-2 ${
                          pathname === "/liquidity"
                            ? "bg-indigo-600 text-white"
                            : "text-neutral-400 hover:bg-neutral-800"
                        }`}
                      >
                        <Droplets className="w-5 h-5" />
                        Manage Liquidity
                      </Link>
                      <Link
                        href="/trending"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-4 py-3 text-base font-medium rounded-md transition-colors flex items-center gap-2 ${
                          pathname === "/trending"
                            ? "bg-indigo-600 text-white"
                            : "text-neutral-400 hover:bg-neutral-800"
                        }`}
                      >
                        <TrendingUp className="w-5 h-5" />
                        Copy Trending Coins
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-green-500 text-white rounded-full">
                          NEW
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </header>
            <DynamicAnnouncementBanner />

            <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-0 pt-8 sm:pt-16 bg-neutral-900">
              {children}
            </main>

            {/* Footer */}
            <footer className="w-full bg-neutral-800 border-t border-neutral-700 py-8 sm:py-12 mt-16 rounded-t sm:rounded-none border-x sm:border-x-0">
              <div className="max-w-7xl mx-auto px-4">
                <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
                  memefast.fun is a token creation platform that allows users to
                  generate Solana-based tokens instantly, with no coding
                  required. memefast.fun does not issue, endorse, manage, or
                  provide liquidity for any tokens created using our service. We
                  do not provide financial advice, investment recommendations,
                  or guarantees of value, price, or returns on any tokens.
                  Tokens created on memefast.fun are not securities, and users
                  are solely responsible for ensuring compliance with applicable
                  laws and regulations in their jurisdiction. memefast.fun does
                  not facilitate token trading, fundraising, or liquidity
                  provision. By using memefast.fun, you acknowledge that
                  creating and trading tokens carry significant risks, including
                  loss of funds, market volatility, and regulatory uncertainty.
                  memefast.fun is provided &quot;as is&quot; without warranties
                  of any kind. We are not responsible for any outcomes related
                  to the use of our platform. By using memefast.fun, you accept
                  full responsibility for your actions and any consequences that
                  may arise. Always conduct your own due diligence before
                  engaging with any token or project.
                </p>
                <div className="text-xs sm:text-sm text-neutral-500 flex flex-wrap items-center justify-between">
                  <span>© 2025 memefast.fun | All Rights Reserved</span>
                  <div className="flex items-center space-x-4">
                    <a
                      href="https://t.me/memefastfun"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 fill-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                      </svg>
                      Support on Telegram @memefastfun
                    </a>
                    <a
                      href="https://discord.com/invite/TastwRPTPY"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 fill-indigo-500"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" />
                      </svg>
                      Join our Discord
                    </a>
                    <a
                      href="https://www.youtube.com/@memefast/videos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-300 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 fill-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
                      </svg>
                      Watch on YouTube
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
