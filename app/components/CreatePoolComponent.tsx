"use client";
import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";
import Image from "next/image";
import { Check } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RaydiumPoolsList from "./RaydiumPoolsList";
import { usePlausible } from "next-plausible";

interface TokenInfo {
  tokenAddress: string;
  name: string;
  symbol: string;
  image: string;
}

interface CreatedPool {
  poolId: string;
  tokenA: string;
  tokenASymbol: string;
  tokenB: string;
  tokenBSymbol: string;
  creationDate: string;
  txId: string;
}

const CreatePoolComponent: React.FC<{ initialTokenAddress?: string }> = ({
  initialTokenAddress,
}) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [mintA, setMintA] = useState(initialTokenAddress || "");
  const [mintB, setMintB] = useState({
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
  });
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    txId: string;
    success: boolean;
    message?: string;
  } | null>(null);
  const [savedTokens, setSavedTokens] = useState<TokenInfo[]>([]);
  const [tokenBalances, setTokenBalances] = useState<{ [key: string]: number }>(
    {}
  );
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [refreshTrigger] = useState(0);

  const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const SOL_ADDRESS = "So11111111111111111111111111111111111111112";

  const RAYDIUM_POOL_FEES = 0.25; // SOL - this is included in MINIMUM_SOL_BALANCE
  const MINIMUM_SOL_BALANCE = 0.25; // Required SOL for transaction (includes pool fees)

  useEffect(() => {
    const storedTokens = JSON.parse(
      localStorage.getItem("createdTokens") || "[]"
    );
    setSavedTokens(storedTokens);

    // Check for pendingPoolToken in localStorage
    const pendingPoolToken = localStorage.getItem("pendingPoolToken");
    if (pendingPoolToken) {
      setMintA(pendingPoolToken);
    }
  }, []);

  // Function to fetch token balance
  const getTokenBalance = async (mintAddress: string) => {
    if (!publicKey) return 0;
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: new PublicKey(mintAddress) }
      );
      if (tokenAccounts.value.length === 0) return 0;
      return tokenAccounts.value[0].account.data.parsed.info.tokenAmount
        .uiAmount;
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return 0;
    }
  };

  // Function to fetch SOL balance
  const getSolBalance = async () => {
    if (!publicKey) return 0;
    try {
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      return 0;
    }
  };

  const plausible = usePlausible();

  // Fetch balances when component mounts or when wallet changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey) return;
      setIsLoadingBalances(true);
      try {
        // Fetch SOL balance
        const solBalance = await getSolBalance();

        // Fetch USDC balance
        const usdcBalance = await getTokenBalance(USDC_ADDRESS);

        // Fetch balances for saved tokens
        const tokenBalancesPromises = savedTokens.map(async (token) => {
          const balance = await getTokenBalance(token.tokenAddress);
          return [token.tokenAddress, balance];
        });

        const tokenBalancesArray = await Promise.all(tokenBalancesPromises);
        const balances = Object.fromEntries([
          [SOL_ADDRESS, solBalance],
          [USDC_ADDRESS, usdcBalance],
          ...tokenBalancesArray,
        ]);

        setTokenBalances(balances);
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [publicKey, connection, savedTokens]);

  const calculateMaxAmount = (tokenAddress: string) => {
    const balance = tokenBalances[tokenAddress] || 0;
    if (tokenAddress === SOL_ADDRESS) {
      return Number(Math.max(balance - RAYDIUM_POOL_FEES, 0).toFixed(2));
    }
    return balance;
  };

  const handleAmountAButton = (type: "half" | "90" | "max") => {
    if (!mintA) return;
    const maxAmount = calculateMaxAmount(mintA);
    const amount =
      type === "half"
        ? maxAmount / 2
        : type === "90"
        ? maxAmount * 0.9
        : maxAmount;
    setAmountA(amount.toString());
  };

  const handleAmountBButton = (type: "half" | "max") => {
    const maxAmount = calculateMaxAmount(mintB.address);
    const amount = type === "half" ? maxAmount / 2 : maxAmount;
    if (mintB.symbol === "SOL") {
      setAmountB(Number(amount.toFixed(2)).toString());
    } else {
      setAmountB(amount.toString());
    }
  };

  const handleAmountBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (mintB.symbol === "SOL") {
      // Only allow up to 2 decimal places for SOL
      const regex = /^\d*\.?\d{0,2}$/;
      if (regex.test(value) || value === "") {
        setAmountB(value);
      }
    } else {
      setAmountB(value);
    }
  };

  const isCreatePoolDisabled = () => {
    // Check if any amount is 0 or empty
    if (
      !amountA ||
      !amountB ||
      parseFloat(amountA) === 0 ||
      parseFloat(amountB) === 0
    ) {
      return true;
    }

    const solBalance = tokenBalances[SOL_ADDRESS] || 0;

    // If Token B is SOL, add its amount to minimum required SOL
    if (mintB.symbol === "SOL") {
      return solBalance < MINIMUM_SOL_BALANCE + parseFloat(amountB);
    }

    // If Token B is not SOL, just check minimum required SOL
    return solBalance < MINIMUM_SOL_BALANCE;
  };

  const showToast = (message: string, type: "success" | "error") => {
    toast[type](message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const isInsufficientSol = () => {
    const solBalance = tokenBalances[SOL_ADDRESS] || 0;
    if (mintB.symbol === "SOL" && amountB) {
      return solBalance < MINIMUM_SOL_BALANCE + parseFloat(amountB);
    }
    return solBalance < MINIMUM_SOL_BALANCE;
  };

  const savePoolToLocalStorage = (poolInfo: CreatedPool) => {
    const existingPools = JSON.parse(
      localStorage.getItem("createdPools") || "[]"
    );
    const updatedPools = [...existingPools, poolInfo];
    localStorage.setItem("createdPools", JSON.stringify(updatedPools));

    // Save initial amounts
    const initialPoolAmounts = JSON.parse(
      localStorage.getItem("initialPoolAmounts") || "{}"
    );
    initialPoolAmounts[poolInfo.tokenA] = {
      tokenB: mintB.symbol,
      amount: parseFloat(amountB),
    };
    localStorage.setItem(
      "initialPoolAmounts",
      JSON.stringify(initialPoolAmounts)
    );
  };

  const createPool = async () => {
    if (!publicKey || !signTransaction) {
      showToast("Please connect your wallet", "error");
      return;
    }

    if (isInsufficientSol()) {
      const requiredSol =
        mintB.symbol === "SOL"
          ? (MINIMUM_SOL_BALANCE + parseFloat(amountB)).toFixed(2)
          : MINIMUM_SOL_BALANCE.toFixed(2);
      showToast(
        `Insufficient SOL balance. Required: ${requiredSol} SOL`,
        "error"
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const raydium = await Raydium.load({
        connection,
        owner: publicKey,
        cluster: "mainnet",
        disableFeatureCheck: true,
        blockhashCommitment: "finalized",
        signAllTransactions,
      });

      const mintAInfo = await raydium.token.getTokenInfo(new PublicKey(mintA));
      const mintBInfo = await raydium.token.getTokenInfo(
        new PublicKey(mintB.address)
      );

      const feeConfigs = await raydium.api.getCpmmConfigs();

      // Convert amounts to proper decimals
      const amountAWithDecimals = new BN(
        parseFloat(amountA) * Math.pow(10, mintAInfo.decimals)
      );

      const amountBWithDecimals = new BN(
        mintB.symbol === "SOL"
          ? parseFloat(amountB) * LAMPORTS_PER_SOL
          : parseFloat(amountB) * Math.pow(10, mintBInfo.decimals)
      );

      const { execute, extInfo } = await raydium.cpmm.createPool({
        programId: CREATE_CPMM_POOL_PROGRAM,
        poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
        mintA: mintAInfo,
        mintB: mintBInfo,
        mintAAmount: amountAWithDecimals,
        mintBAmount: amountBWithDecimals,
        startTime: new BN(0),
        feeConfig: feeConfigs[0],
        associatedOnly: false,
        ownerInfo: {
          feePayer: publicKey,
          useSOLBalance: true,
        },
        txVersion: 0,
        txTipConfig: {
          address: new PublicKey(
            "5a1BuZAgY1AAEiZjM9APiWg5tYk2E2WVYtWEXPFhUGBx"
          ),
          amount: new BN(0.1 * LAMPORTS_PER_SOL),
        },
      });

      const { txId } = await execute({
        sendAndConfirm: true,
      });

      // Save pool information to localStorage
      const poolInfo: CreatedPool = {
        poolId: extInfo.address.toString(),
        tokenA: mintA,
        tokenASymbol:
          savedTokens.find((t) => t.tokenAddress === mintA)?.symbol || "",
        tokenB: mintB.address,
        tokenBSymbol: mintB.symbol,
        creationDate: new Date().toISOString(),
        txId: txId,
      };

      savePoolToLocalStorage(poolInfo);

      // Clear the pendingPoolToken from localStorage
      localStorage.removeItem("pendingPoolToken");

      // Reset all form values
      setMintA("");
      setAmountA("");
      setAmountB("");

      showToast("Pool created successfully!", "success");
      setResult({
        txId: txId,
        success: true,
      });

      plausible("add", { revenue: { currency: "USD", amount: 14 } });

      // Trigger refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: unknown) {
      console.error("Error creating pool:", error);
      if (error instanceof Error) {
        // Check for user rejection
        if (error.message.includes("User rejected")) {
          showToast("Transaction was rejected", "error");
        } else {
          showToast(`Error creating pool: ${error.message}`, "error");
        }
      } else {
        showToast(
          "An unexpected error occurred while creating the pool",
          "error"
        );
      }
      setResult({
        txId: "",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full sm:w-[800px]">
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">
        Create Raydium Liquidity Pool
      </h2>
      <div className="bg-neutral-800 p-6 rounded-lg mb-16 w-full sm:w-[800px]">
        <div className="space-y-6">
          <div>
            <label className="block text-base font-medium text-gray-300 mb-4">
              For which token would you like to create a pool?
            </label>
            <div className="relative">
              <select
                value={mintA}
                onChange={(e) => setMintA(e.target.value)}
                className="w-full p-2 pr-10 bg-neutral-700 text-white rounded appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Choose your token
                </option>
                {savedTokens.map((token) => (
                  <option key={token.tokenAddress} value={token.tokenAddress}>
                    {token.symbol}{" "}
                    {token.image === "/placeholder-token.svg" &&
                      "(Your Token icon will display soon)"}{" "}
                    - Balance:{" "}
                    {isLoadingBalances
                      ? "Loading..."
                      : `${
                          tokenBalances[token.tokenAddress]?.toLocaleString() ??
                          "0"
                        } ${token.symbol}`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {mintA && (
              <div className="mt-2 flex items-center space-x-2">
                {savedTokens.find((token) => token.tokenAddress === mintA)
                  ?.image && (
                  <img
                    src={
                      savedTokens.find((token) => token.tokenAddress === mintA)
                        ?.image
                    }
                    alt="Token"
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <input
                  type="text"
                  value={mintA}
                  readOnly
                  className="flex-1 p-2 bg-neutral-600 text-white rounded text-sm font-mono"
                />
              </div>
            )}
          </div>

          {mintA && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token B
                </label>
                <div className="relative flex items-center space-x-2">
                  <Image
                    src={
                      mintB.symbol === "SOL"
                        ? "/solana-sol-logo.svg"
                        : "/usd-coin-usdc-logo.svg"
                    }
                    alt={mintB.symbol}
                    width={24}
                    height={24}
                    className=""
                  />
                  <select
                    value={mintB.address}
                    onChange={(e) =>
                      setMintB(
                        e.target.value === SOL_ADDRESS
                          ? { address: SOL_ADDRESS, symbol: "SOL" }
                          : { address: USDC_ADDRESS, symbol: "USDC" }
                      )
                    }
                    className="flex-1 p-2 pr-10 bg-neutral-700 text-white rounded appearance-none cursor-pointer"
                  >
                    <option value={SOL_ADDRESS}>
                      SOL - Balance:{" "}
                      {isLoadingBalances
                        ? "Loading..."
                        : `${
                            tokenBalances[SOL_ADDRESS]?.toLocaleString() ?? "0"
                          } SOL`}
                    </option>
                    <option value={USDC_ADDRESS}>
                      USDC - Balance:{" "}
                      {isLoadingBalances
                        ? "Loading..."
                        : `${
                            tokenBalances[USDC_ADDRESS]?.toLocaleString() ?? "0"
                          } USDC`}
                    </option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-300">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount Token A
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={amountA}
                      onChange={(e) => setAmountA(e.target.value)}
                      className="w-full p-2 bg-neutral-700 text-white rounded"
                      placeholder={"0"}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                      <button
                        onClick={() => handleAmountAButton("half")}
                        className="px-2 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors"
                        disabled={!mintA || isLoadingBalances}
                      >
                        Half
                      </button>
                      <button
                        onClick={() => handleAmountAButton("90")}
                        className="px-2 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors"
                        disabled={!mintA || isLoadingBalances}
                      >
                        90%
                      </button>
                      <button
                        onClick={() => handleAmountAButton("max")}
                        className="px-2 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors"
                        disabled={!mintA || isLoadingBalances}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>
                {mintA && (
                  <div className="mt-1 text-xs text-neutral-400">
                    Balance:{" "}
                    {isLoadingBalances
                      ? "Loading..."
                      : `${tokenBalances[mintA]?.toLocaleString() ?? "0"} ${
                          savedTokens.find((t) => t.tokenAddress === mintA)
                            ?.symbol || ""
                        }`}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount Token B{" "}
                  {mintB.symbol === "SOL" && "(0.2 SOL reserved for fees)"}
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={amountB}
                      onChange={handleAmountBChange}
                      className="w-full p-2 bg-neutral-700 text-white rounded"
                      placeholder={mintB.symbol === "SOL" ? "0.00" : "0"}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                      <button
                        onClick={() => handleAmountBButton("half")}
                        className="px-2 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors"
                        disabled={isLoadingBalances}
                      >
                        Half
                      </button>
                      <button
                        onClick={() => handleAmountBButton("max")}
                        className="px-2 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors"
                        disabled={isLoadingBalances}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  Balance:{" "}
                  {isLoadingBalances
                    ? "Loading..."
                    : `${
                        tokenBalances[mintB.address]?.toLocaleString() ?? "0"
                      } ${mintB.symbol}`}
                </div>
              </div>

              <button
                onClick={createPool}
                disabled={loading || isCreatePoolDisabled()}
                className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center font-bold text-lg"
              >
                {loading ? (
                  "Creating Pool..."
                ) : (
                  <>
                    Create Pool
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
        {result && (
          <div
            className={`mt-4 ${
              result.success ? "text-green-400" : "text-red-400"
            }`}
          >
            {result.success ? (
              <div>
                <div className="flex items-center gap-2">
                  <span>Pool created successfully!</span>

                  <a
                    href={`https://solscan.io/tx/${result.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View transaction
                  </a>
                </div>
                <div className="mt-2 text-base text-neutral-400">
                  Update your Raydium Pools List by clicking the refresh button
                  below.
                </div>
              </div>
            ) : (
              <span>{result.message}</span>
            )}
          </div>
        )}
      </div>
      <RaydiumPoolsList refreshTrigger={refreshTrigger} />
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

export default CreatePoolComponent;
