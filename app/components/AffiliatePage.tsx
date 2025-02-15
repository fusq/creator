"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@supabase/supabase-js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AffiliateData {
  id: string;
  solana_address: string;
  affiliate_id: string;
  created_at: string;
}

export const AffiliatePage = () => {
  const { publicKey, connected } = useWallet();
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Function to generate a unique affiliate ID
  const generateAffiliateId = () => Math.random().toString(36).slice(2, 10);

  // Function to check if wallet is already registered
  const checkExistingAffiliate = async (address: string) => {
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .eq("solana_address", address)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        // PGRST116 is the "no rows" error code
        console.error("Error checking affiliate:", error);
        setError("Error checking affiliate status");
      }
      return null;
    }

    return data;
  };

  // Function to register new affiliate
  const registerAffiliate = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if wallet is already registered
      const existing = await checkExistingAffiliate(publicKey.toString());

      if (existing) {
        setAffiliateData(existing);
        return;
      }

      // Create new affiliate record
      const newAffiliateData = {
        solana_address: publicKey.toString(),
        affiliate_id: generateAffiliateId(),
      };

      const { data, error } = await supabase
        .from("affiliates")
        .insert([newAffiliateData])
        .select()
        .single();

      if (error) throw error;

      setAffiliateData(data);
    } catch (err) {
      console.error("Error registering affiliate:", err);
      setError("Error registering as affiliate");
    } finally {
      setIsLoading(false);
    }
  };

  // Check affiliate status when wallet connects
  useEffect(() => {
    if (publicKey) {
      checkExistingAffiliate(publicKey.toString()).then((data) => {
        if (data) setAffiliateData(data);
      });
    }
  }, [publicKey]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const getAffiliateLink = () => {
    if (!affiliateData) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/?r=${affiliateData.affiliate_id}`;
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-6">
            Affiliate Program
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Join our Affiliate Program and unlock exciting opportunities to earn
            rewards while spreading the word about our service. With each token
            created using your referral link, you earn{" "}
            <span className="text-indigo-400 font-semibold">
              50% of the fees
            </span>
            . It&apos;s a win-win opportunity – you promote, and you earn!
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-neutral-800 rounded-xl p-8 shadow-lg border border-neutral-700">
          {!connected ? (
            <div className="flex items-center justify-center h-full text-center py-8">
              <WalletMultiButton className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                Connect Wallet to Become an Affiliate
              </WalletMultiButton>
            </div>
          ) : !affiliateData ? (
            <div className="text-center py-8">
              <button
                onClick={registerAffiliate}
                disabled={isLoading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Get Affiliate Link"}
              </button>
              {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Your Affiliate Link
                </h2>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-4 bg-neutral-900 border border-indigo-600 rounded-lg text-neutral-300 font-mono text-sm break-all">
                    {getAffiliateLink()}
                  </code>
                  <button
                    onClick={() => copyToClipboard(getAffiliateLink())}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {copySuccess ? (
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-700">
                  <h3 className="text-lg font-medium text-white mb-2">
                    How it Works
                  </h3>
                  <ul className="text-neutral-400 space-y-2">
                    <li>1. Share your unique affiliate link</li>
                    <li>2. Users create tokens through your link</li>
                    <li>3. Earn 50% of the fees automatically</li>
                    <li>
                      4. Payments are{" "}
                      <span className="text-indigo-400 font-semibold">
                        sent instantly
                      </span>{" "}
                      to your wallet
                    </li>
                  </ul>
                </div>

                <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-700">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Your Earnings
                  </h3>
                  <p className="text-neutral-400">
                    You earn 50% of all fees from tokens created using your
                    link:
                  </p>
                  <ul className="text-neutral-400 mt-2 space-y-1">
                    <li>• Base Creation: 0.05 SOL</li>
                    <li>• Each Authority Revoke: 0.05 SOL</li>
                    <li>• Custom Creator Info: 0.05 SOL</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                How does the Affiliate Program work?
              </h3>
              <ol className="list-decimal list-inside text-neutral-400 space-y-2">
                <li>Connect your wallet to receive rewards.</li>
                <li>
                  Click &quot;Get Affiliate Link&quot; to obtain your unique
                  affiliate link.
                </li>
                <li>
                  Share your referral link on Twitter, YouTube, Discord, and
                  other social networks.
                </li>
                <li>
                  When a user clicks your link, your referral code is stored in
                  their browser. You&apos;ll receive rewards for every token
                  they create.
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                What are the reward amounts?
              </h3>
              <p className="text-neutral-400">
                The reward for each created token is 50% of the fee. For
                example, if your referral creates a token with a 0.5 SOL fee,
                0.25 SOL will automatically be sent to your wallet upon token
                creation.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                How long does my referral link remain active?
              </h3>
              <p className="text-neutral-400">
                Your referral code is stored in the user&apos;s browser for 30
                days. This means you&apos;ll still receive your commission if
                the user returns to create a token within that period, even if
                they don&apos;t use your link directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
