"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  RefreshCw,
  MessageCircle,
  TrendingUp,
  Crown,
  Copy,
  Coins,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Metaplex } from "@metaplex-foundation/js";
import {
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Connection,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { walletAdapterIdentity } from "@metaplex-foundation/js";
import { usePlausible } from "next-plausible";

interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  image_uri: string;
  usd_market_cap: number;
  last_trade_timestamp: number;
  description: string;
  reply_count: number;
  twitter: string | null;
  telegram: string | null;
  king_of_the_hill_timestamp: number;
  metadata_uri: string;
}

const TrendingTokensList: React.FC = ({}) => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { publicKey, signTransaction, connected } = useWallet();
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [createdTokenInfo, setCreatedTokenInfo] = useState<{
    tokenAddress: string;
    txId: string;
    name: string;
    symbol: string;
    totalSupply: string;
    creationDate: string;
    image: string;
  } | null>(null);
  const [isTransactionSubmitted, setIsTransactionSubmitted] = useState(false);

  // Add this to your state declarations at the top of the component
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Add this function inside your component
  const copyToClipboard = async (text: string, tokenAddress: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(tokenAddress);
      setTimeout(() => setCopySuccess(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/pumpfun");
      if (!response.ok) {
        throw new Error("Failed to fetch tokens");
      }
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const plausible = usePlausible();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTokens();
  };

  const formatMarketCap = (marketCap: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(marketCap);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Find the most recent King of the Hill timestamp
  const mostRecentKingTimestamp = Math.max(
    ...tokens.map((token) => token.king_of_the_hill_timestamp)
  );

  const createCoin = async (token: TokenInfo) => {
    if (!connected) {
      toast.error("Please connect your wallet first!");
      return;
    }

    if (!publicKey || !signTransaction) {
      toast.error(
        "Wallet connection error. Please try reconnecting your wallet."
      );
      return;
    }

    try {
      setIsCreating(token.mint);

      const devnetConnection = new Connection(
        "https://mainnet.helius-rpc.com/?api-key=3212d845-480e-4b86-af4f-c8150ebb819a"
      );
      const metaplex = Metaplex.make(devnetConnection);

      // Add balance check here
      const balance = await devnetConnection.getBalance(publicKey);
      const balanceInSOL = balance / LAMPORTS_PER_SOL;

      if (balanceInSOL < 0.5) {
        toast.error(
          "Insufficient balance. You need at least 0.5 SOL to copy a coin."
        );
        return;
      }

      const wallet = {
        publicKey: publicKey,
        signTransaction: signTransaction,
      };

      metaplex.use(walletAdapterIdentity(wallet));

      // Generate mint keypair
      const mintKeypair = Keypair.generate();
      const rentExemptBalance =
        await devnetConnection.getMinimumBalanceForRentExemption(MINT_SIZE);

      const transaction = new Transaction();

      // Add create account instruction
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: rentExemptBalance,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          6,
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        )
      );

      // Get token account
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        publicKey
      );

      // Create token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          tokenAccount,
          publicKey,
          mintKeypair.publicKey
        )
      );

      // Mint initial supply
      const totalSupplyBigInt = BigInt(1000000000000000); // 1 trillion with 6 decimals
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          tokenAccount,
          publicKey,
          totalSupplyBigInt
        )
      );

      // Create metadata
      const builder = await metaplex.nfts().builders().create({
        uri: token.metadata_uri,
        name: token.name,
        symbol: token.symbol,
        sellerFeeBasisPoints: 0,
        useNewMint: mintKeypair,
        tokenStandard: 2,
        isMutable: true,
      });

      transaction.add(builder.getInstructions()[0]);

      // Revoke authorities
      transaction.add(
        createSetAuthorityInstruction(
          mintKeypair.publicKey,
          publicKey,
          AuthorityType.MintTokens,
          null
        )
      );

      transaction.add(
        createSetAuthorityInstruction(
          mintKeypair.publicKey,
          publicKey,
          AuthorityType.FreezeAccount,
          null
        )
      );

      // Modify the platform fee transfer instructions
      const platformWallet = new PublicKey(
        "5wjVrCmsQbmpM1Fgx1u7LyCTYSxsN9gZ7g4vSma5enp"
      );

      const totalFeeLamports = Math.floor(0.5 * LAMPORTS_PER_SOL);

      const transferToPlatformInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: platformWallet,
        lamports: totalFeeLamports,
      });
      transaction.add(transferToPlatformInstruction);

      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (
        await devnetConnection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = publicKey;

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);
      signedTransaction.partialSign(mintKeypair);

      // Show processing modal only after user has signed
      setShowProcessingModal(true);
      setIsTransactionSubmitted(true);

      // Send and confirm transaction
      const txid = await devnetConnection.sendRawTransaction(
        signedTransaction.serialize()
      );
      await devnetConnection.confirmTransaction(txid);

      // Create token info object with total supply without decimals
      const totalSupplyWithoutDecimals = "1000000000"; // 1 trillion without the 6 decimals
      const tokenInfo = {
        tokenAddress: mintKeypair.publicKey.toString(),
        txId: txid,
        name: token.name,
        symbol: token.symbol,
        totalSupply: totalSupplyWithoutDecimals,
        creationDate: new Date().toISOString(),
        image: token.image_uri,
      };

      // Send Plausible event for successful token creation
      plausible("create");

      // Store in localStorage
      const existingTokens = JSON.parse(
        localStorage.getItem("createdTokens") || "[]"
      );
      existingTokens.unshift(tokenInfo);
      localStorage.setItem("createdTokens", JSON.stringify(existingTokens));
      localStorage.setItem("pendingPoolToken", tokenInfo.tokenAddress);

      // Update state to show success modal
      setCreatedTokenInfo(tokenInfo);
      setShowProcessingModal(false);
      setShowSuccessModal(true);

      toast.success("Token created successfully!");
    } catch (error) {
      setShowProcessingModal(false);
      setIsTransactionSubmitted(false);
      console.error("Error creating token:", error);
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast.error("Transaction was rejected");
        } else {
          toast.error(`Error creating token: ${error.message}`);
        }
      } else {
        toast.error("An unexpected error occurred while creating the token");
      }
    } finally {
      setIsCreating(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-0 sm:px-6 lg:px-8">
      <div className="mb-8 mx-auto">
        <div className="space-y-4 text-center">
          <div className="inline-block px-3 py-2 bg-indigo-600 rounded-lg mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white Lexend">
              Copy Trending Coins in 1 Click ⚡
            </h2>
          </div>
          <p className="text-neutral-400 text-sm sm:text-base mx-auto">
            Copy the latest trending coins from{" "}
            <span className="inline-flex items-center align-middle">
              <Image
                src="/pumpfun.png"
                alt="Pump.fun"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </span>{" "}
            pump.fun in 1 click and deploy them on Raydium{" "}
            <span className="text-indigo-500">before the community</span> does.
          </p>
          <div className="text-white text-base sm:text-lg mx-auto">
            We only show you the most recent and best coins with the most
            engagement and biggest market caps.{" "}
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 inline-block text-green-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefresh}
          className={`px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors ${
            isRefreshing ? "opacity-75" : ""
          }`}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="bg-neutral-800 p-6 rounded-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <div className="mt-4 text-neutral-400 text-sm">
              Loading trending tokens
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div
                key={token.mint}
                className={`flex flex-col p-4 rounded-lg transition-colors ${
                  token.king_of_the_hill_timestamp === mostRecentKingTimestamp
                    ? "bg-gradient-to-r from-indigo-900/50 to-neutral-700 border border-indigo-500/50"
                    : "bg-neutral-700 hover:bg-neutral-600"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4 sm:flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 relative flex-shrink-0">
                        <Image
                          src={token.image_uri}
                          alt={token.name}
                          fill
                          className="rounded-full object-cover"
                          style={{ aspectRatio: "1/1" }}
                        />
                      </div>
                      {token.king_of_the_hill_timestamp ===
                        mostRecentKingTimestamp && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                          <Crown className="h-4 w-4 text-neutral-900" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap">
                        <h3 className="text-lg font-semibold text-white mr-2">
                          {token.name}
                        </h3>
                        {token.king_of_the_hill_timestamp ===
                          mostRecentKingTimestamp && (
                          <span className="px-2 py-1 bg-yellow-500 text-xs font-bold text-neutral-900 rounded-full mt-1 sm:mt-0">
                            KING OF THE HILL
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 flex items-center flex-wrap">
                        <span>{token.symbol}</span>
                        <span className="mx-2">•</span>
                        <span className="text-neutral-400 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {token.reply_count} replies
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right sm:min-w-[200px]">
                    <div className="flex items-center justify-between sm:justify-end">
                      <span className="text-gray-400 mr-2">Market Cap:</span>
                      <p className="text-lg font-medium text-green-400">
                        {formatMarketCap(token.usd_market_cap)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Last trade: {formatTimestamp(token.last_trade_timestamp)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {token.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`https://pump.fun/coin/${token.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        <Image
                          src="/pumpfun.png"
                          alt="Pump.fun"
                          width={20}
                          height={20}
                          className="w-4 h-4"
                        />
                      </a>
                      {token.twitter && (
                        <a
                          href={token.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-white transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                      {token.telegram && (
                        <a
                          href={token.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-white transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => createCoin(token)}
                      disabled={isCreating === token.mint}
                      className={`px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center ${
                        isCreating === token.mint ? "opacity-75" : ""
                      }`}
                    >
                      {isCreating === token.mint ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {isCreating === token.mint
                        ? "Creating..."
                        : "Create Coin"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processing Modal - Styled like TokenCreationForm */}
      {showProcessingModal && isTransactionSubmitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-indigo-900 rounded-2xl p-8 max-w-lg w-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-medium text-white mb-2">
                  Creating Your Token
                </h3>
                <p className="text-neutral-400">
                  Please wait while we process your transaction...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && createdTokenInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-indigo-900 rounded-2xl p-6 sm:p-8 max-w-lg w-full relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-2 right-2 text-neutral-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-green-800 rounded-full p-2">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Token Created Successfully!
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Token Address
                </label>
                <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg">
                  <span className="text-sm text-neutral-400 truncate">
                    {createdTokenInfo.tokenAddress}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        createdTokenInfo.tokenAddress,
                        createdTokenInfo.tokenAddress
                      )
                    }
                    className="ml-2 p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {copySuccess === createdTokenInfo.tokenAddress ? (
                      <svg
                        className="w-5 h-5 text-green-500"
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
                        className="w-5 h-5"
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

              <div className="grid grid-cols-1 gap-3">
                <Link
                  href="/liquidity"
                  onClick={() => {
                    setShowSuccessModal(false);
                  }}
                  className="flex items-center justify-center space-x-2 p-2 bg-neutral-900 hover:bg-neutral-700 rounded-lg text-white transition-colors text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Create Liquidity Pool</span>
                </Link>

                <a
                  href={`https://solscan.io/token/${createdTokenInfo.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 p-2 bg-neutral-900 hover:bg-neutral-700 rounded-lg text-white transition-colors text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>View on Explorer</span>
                </a>

                <a
                  href={`https://solscan.io/tx/${createdTokenInfo.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 p-2 bg-neutral-900 hover:bg-neutral-700 rounded-lg text-white transition-colors text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span>View Transaction</span>
                </a>
              </div>

              <p className="text-xs text-neutral-400 text-center mt-4">
                Add this token to your wallet using the token address above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add this section to direct users to custom coin creation */}
      <div className="mt-8 sm:mt-16 text-center">
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50 mx-auto">
          <h3 className="text-lg font-medium text-white/90 mb-2">
            Want to create your own custom coin instead?
          </h3>
          <p className="text-neutral-400 text-sm mb-3">
            Design your own token with custom name, symbol, and image.
          </p>
          <Link
            href="/create-coin"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors flex items-center justify-center mx-auto w-fit"
          >
            <Coins className="w-3.5 h-3.5 mr-1.5" />
            Create Custom Coin
          </Link>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={2}
      />
    </div>
  );
};

export default TrendingTokensList;
