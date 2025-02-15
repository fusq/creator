import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createClient } from "@supabase/supabase-js";

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
  const generateAffiliateId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

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
            <div className="text-center py-8">
              <p className="text-white mb-4">
                Please connect your wallet to become an affiliate
              </p>
            </div>
          ) : !affiliateData ? (
            <div className="text-center py-8">
              <button
                onClick={registerAffiliate}
                disabled={isLoading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
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
                  <code className="flex-1 p-4 bg-neutral-900 rounded-lg text-neutral-300 font-mono text-sm break-all">
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
      </div>
    </div>
  );
};
