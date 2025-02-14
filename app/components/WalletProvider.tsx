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
              <h1 className="text-4xl font-bold mb-2 text-white bg-indigo-600">
                Create Your Own Token FAST
              </h1>
              <p className="text-lg text-neutral-400">
                Launch your own token on Solana in seconds. No coding required.
              </p>
              <TokenCreationForm />

              {/* How to use guide */}
              <div className="w-[862px] bg-neutral-800 rounded-2xl p-12 mb-16 mt-8 border border-neutral-700">
                <h2 className="text-2xl font-semibold text-white mb-8">
                  How to use Solana Token Creator
                </h2>

                <h3 className="text-lg text-white mb-6">
                  Follow these simple steps:
                </h3>

                <ol className="list-decimal list-inside space-y-4 text-lg text-white ml-4">
                  <li>Connect your Solana wallet.</li>
                  <li>Write the name you want for your Token.</li>
                  <li>Indicate the symbol (max 8 characters).</li>
                  <li>Write the description you want for your SPL Token.</li>
                  <li>Upload the image for your token (PNG).</li>
                  <li>Put the supply of your Token.</li>
                  <li>
                    Click on Create, accept the transaction, and wait until your
                    token is ready.
                  </li>
                </ol>

                <div className="mt-8 space-y-4 text-base">
                  <p className="text-white">
                    The cost of creating the Token is{" "}
                    <span className="text-[#7dd3fc]">0.1 SOL</span>, which
                    includes all fees needed for the SPL Token creation.
                  </p>
                  <p className="text-white">
                    The creation process will start and will take some seconds.
                    After that, you will receive the total supply of the token
                    in the wallet you chose.
                  </p>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="w-[862px] bg-neutral-800 rounded-2xl p-12 mb-16 mt-8 border border-neutral-700">
                <h2 className="text-2xl font-semibold text-white mb-8">
                  Frequently Asked Questions
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      What is Solana, and why should I launch my token on it?
                    </h3>
                    <p className="text-neutral-400">
                      Solana is a high-performance blockchain platform known for
                      its fast transactions, low fees, and scalability.
                      It&apos;s an excellent choice for launching tokens due to
                      its growing ecosystem, strong developer community, and
                      widespread adoption in the crypto space.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      How can I create a token on the Solana blockchain?
                    </h3>
                    <p className="text-neutral-400">
                      Creating a token on Solana is straightforward with our
                      platform. Simply connect your wallet, fill in your token
                      details (name, symbol, supply, etc.), customize settings
                      if needed, and submit. Our tool handles all the technical
                      aspects of token creation for you.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      What are the steps to deploy my own token on Solana?
                    </h3>
                    <p className="text-neutral-400">
                      The process involves: 1) Connecting your Solana wallet, 2)
                      Providing token details like name and symbol, 3) Setting
                      the supply and decimals, 4) Uploading token image and
                      metadata, 5) Configuring optional settings like freeze
                      authority, and 6) Confirming the transaction. Our platform
                      guides you through each step.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      How can I manage token authorities on Solana?
                    </h3>
                    <p className="text-neutral-400">
                      Token authorities on Solana can be managed through our
                      platform. You can set and revoke different authorities
                      like freeze, mint, and update authority during token
                      creation. These settings determine who can perform certain
                      actions with your token after deployment.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      What platforms can assist with launching a token on
                      Solana?
                    </h3>
                    <p className="text-neutral-400">
                      There are several platforms available, including MemeFast
                      (our platform), which provides a user-friendly interface
                      for token creation. Other options include Solana&apos;s
                      CLI tools and various development frameworks, but our
                      platform offers the most straightforward solution for
                      non-technical users.
                    </p>
                  </div>
                </div>
              </div>

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
