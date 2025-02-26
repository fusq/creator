import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Raydium, Percent } from "@raydium-io/raydium-sdk-v2";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";
import { toast } from "react-toastify";
import axios from "axios";
import { usePlausible } from "next-plausible";

interface PoolInfo {
  configId: PublicKey;
  poolCreator: PublicKey;
  vaultA: PublicKey;
  vaultB: PublicKey;
  mintLp: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  lpDecimals: number;
  mintDecimalA: number;
  mintDecimalB: number;
  lpAmount: BN;
  baseReserve: BN;
  quoteReserve: BN;
  vaultAAmount: BN;
  vaultBAmount: BN;
  status: number;
  openTime: BN;
  poolId: PublicKey;
  lpBalance: BN;
}

interface StoredPool {
  poolId: string;
  tokenA: string;
  tokenASymbol: string;
  tokenB: string;
  tokenBSymbol: string;
  creationDate: string;
  txId: string;
}

interface Props {
  onRefresh?: () => void;
  refreshTrigger?: number;
}

const RaydiumPoolsList: React.FC<Props> = ({ onRefresh, refreshTrigger }) => {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const { connection } = useConnection();
  const { publicKey, signAllTransactions } = useWallet();
  const [poolsInfo, setPoolsInfo] = useState<
    Record<string, PoolInfo & { symbols: { a: string; b: string } }>
  >({});
  const [loading, setLoading] = useState(false);
  const [customTxId, setCustomTxId] = useState("");
  const [initialPoolAmounts, setInitialPoolAmounts] = useState<
    Record<string, { tokenB: string; amount: number }>
  >({});

  const fetchSolPrice = async () => {
    try {
      const response = await axios.get("/api/get-sol-price");
      console.log("SOL Price:", response.data.price);
      return response.data.price;
    } catch (error) {
      console.error("Error fetching SOL price:", error);
      return null;
    }
  };

  const plausible = usePlausible();

  const fetchPoolsWithSolPrice = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      // Fetch SOL price first
      const solPrice = await fetchSolPrice();
      setSolPrice(solPrice);

      const raydium = await Raydium.load({
        connection,
        owner: publicKey,
        cluster: "mainnet",
        disableFeatureCheck: true,
        blockhashCommitment: "finalized",
        signAllTransactions,
      });

      // Get stored pools and reverse to show newest first
      const storedPools: StoredPool[] = JSON.parse(
        localStorage.getItem("createdPools") || "[]"
      ).reverse();

      if (storedPools.length === 0) {
        setPoolsInfo({});
        return;
      }

      const poolIdsResults = await Promise.all(
        storedPools.map((pool) => getPoolIdFromTransaction(pool.txId))
      );
      const validPoolIds = poolIdsResults.filter(
        (id): id is string => id !== null
      );
      console.log(validPoolIds);
      const validStoredPools = storedPools.filter(
        (_, index) => poolIdsResults[index] !== null
      );

      if (validPoolIds.length === 0) {
        console.warn("No valid pool IDs found");
        setPoolsInfo({});
        return;
      }

      const allPoolInfos = await raydium.cpmm.getRpcPoolInfos(validPoolIds);

      // Check LP balances for each pool
      const lpBalanceChecks = await Promise.all(
        Object.entries(allPoolInfos).map(async ([, info], index) => {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { mint: info.mintLp }
          );
          const lpBalance =
            tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount
              .amount || "0";
          return {
            txId: validStoredPools[index].txId,
            lpBalance: new BN(lpBalance),
          };
        })
      );

      const poolsWithSymbols: Record<
        string,
        PoolInfo & { symbols: { a: string; b: string }; lpBalance: BN }
      > = {};

      // Create entries in reverse order to maintain newest first
      validPoolIds.forEach((id, index) => {
        const info = allPoolInfos[id];
        const storedPool = validStoredPools[index];
        const lpBalanceCheck = lpBalanceChecks.find(
          (check) => check.txId === storedPool.txId
        );
        if (info) {
          poolsWithSymbols[id] = {
            ...info,
            poolId: new PublicKey(id),
            symbols: {
              a: storedPool.tokenBSymbol,
              b: storedPool.tokenASymbol,
            },
            lpBalance: lpBalanceCheck?.lpBalance || new BN(0),
          };
        }
      });

      setPoolsInfo(poolsWithSymbols);
    } catch (error) {
      console.error("Error fetching Raydium pools:", error);
      setPoolsInfo({});
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPoolsWithSolPrice();
  }, [publicKey, connection]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      onRefresh = fetchPoolsWithSolPrice;
    }
  }, [onRefresh]);

  // Add effect to listen for refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchPoolsWithSolPrice();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const storedInitialPoolAmounts = JSON.parse(
      localStorage.getItem("initialPoolAmounts") || "{}"
    );
    console.log(JSON.stringify(storedInitialPoolAmounts));
    setInitialPoolAmounts(storedInitialPoolAmounts);
  }, []);

  const getPoolIdFromTransaction = async (txId: string) => {
    try {
      const tx = await connection.getParsedTransaction(txId, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta || !tx.meta.innerInstructions) {
        console.warn(`Transaction details not found for ${txId}`);
        return null;
      }

      const innerInstructions = tx.meta.innerInstructions[0];

      if (!innerInstructions || !innerInstructions.instructions) {
        console.warn(`Inner instructions not found for ${txId}`);
        return null;
      }

      const poolCreationInstruction = innerInstructions.instructions[12];

      if (!poolCreationInstruction || !("parsed" in poolCreationInstruction)) {
        console.warn(`Pool creation instruction not found for ${txId}`);
        return null;
      }

      console.log(poolCreationInstruction.parsed.info.newAccount);

      return poolCreationInstruction.parsed.info.newAccount;
    } catch (error) {
      console.error(
        `Error extracting pool ID from transaction ${txId}:`,
        error
      );
      return null;
    }
  };

  const formatBNInteger = (value: BN, decimals: number): number => {
    const num = value.toNumber() / Math.pow(10, decimals);
    return parseFloat(num.toFixed(decimals)); // This ensures we get a number, not a string
  };

  const formatBN = (value: BN, decimals: number) => {
    const num = value.toNumber() / Math.pow(10, decimals);
    if (num >= 1000000) {
      return `${(num / 1000000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}M`;
    }
    return num.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const formatAddress = (address: PublicKey | undefined) => {
    if (!address) return "";
    return address.toString();
  };

  const isValidPoolInfo = (
    poolInfo: unknown
  ): poolInfo is PoolInfo & { symbols: { a: string; b: string } } => {
    return (
      poolInfo !== null &&
      poolInfo !== undefined &&
      typeof poolInfo === "object" &&
      "mintA" in poolInfo &&
      "mintB" in poolInfo &&
      "vaultAAmount" in poolInfo &&
      "vaultBAmount" in poolInfo &&
      "symbols" in poolInfo &&
      typeof (poolInfo as { symbols: unknown }).symbols === "object" &&
      (poolInfo as { symbols: { a: unknown; b: unknown } }).symbols.a !==
        undefined &&
      (poolInfo as { symbols: { a: unknown; b: unknown } }).symbols.b !==
        undefined
    );
  };

  const calculateProfitLoss = (
    poolInfo: PoolInfo & { symbols: { a: string; b: string } }
  ) => {
    const initialAmount = initialPoolAmounts[poolInfo.mintB.toString()];
    console.log("Initial amount:", initialAmount);
    if (!initialAmount) {
      console.log(
        "Initial amount not found for mintB:",
        poolInfo.mintB.toString()
      );
      console.log(
        "Available keys in initialPoolAmounts:",
        Object.keys(initialPoolAmounts)
      );
      return null;
    }

    const isSol = initialAmount.tokenB === "SOL";
    const currentAmount = isSol
      ? formatBNInteger(poolInfo.vaultAAmount, poolInfo.mintDecimalA)
      : formatBNInteger(poolInfo.vaultBAmount, poolInfo.mintDecimalB);
    console.log("Current amount:", currentAmount);

    const difference = currentAmount - initialAmount.amount;
    const percentageChange = (difference / initialAmount.amount) * 100;

    console.log(
      "Difference:",
      difference,
      "Percentage change:",
      percentageChange
    );

    return {
      difference,
      percentageChange,
      tokenSymbol: initialAmount.tokenB,
    };
  };

  const PoolCard: React.FC<{
    poolInfo: PoolInfo & { symbols: { a: string; b: string } };
  }> = ({ poolInfo }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lpBalance, setLpBalance] = useState<BN>(new BN(0));
    const [removePercentage, setRemovePercentage] = useState(0);
    const [isRemoving, setIsRemoving] = useState(false);
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();

    useEffect(() => {
      const fetchLpBalance = async () => {
        if (!publicKey) return;
        try {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { mint: poolInfo.mintLp }
          );
          if (tokenAccounts.value.length > 0) {
            setLpBalance(
              new BN(
                tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount
              )
            );
          }
        } catch (error) {
          console.error("Error fetching LP balance:", error);
        }
      };
      fetchLpBalance();
    }, [publicKey, connection, poolInfo.mintLp]);

    // If LP balance is zero, don't render the card
    if (lpBalance.isZero()) {
      return null;
    }

    const handleRemoveLiquidity = async () => {
      if (!publicKey || !signTransaction) return;
      setIsRemoving(true);
      try {
        const raydium = await Raydium.load({
          connection,
          owner: publicKey,
          cluster: "mainnet",
          signAllTransactions,
        });

        // Get pool info and keys from RPC
        const { poolInfo: rpcPoolInfo, poolKeys } =
          await raydium.cpmm.getPoolInfoFromRpc(poolInfo.poolId.toString());

        const lpAmount = lpBalance
          .mul(new BN(removePercentage))
          .div(new BN(100));
        const slippage = new Percent(1, 100); // 1% slippage

        const { execute } = await raydium.cpmm.withdrawLiquidity({
          poolInfo: rpcPoolInfo,
          poolKeys,
          lpAmount,
          slippage,
          txVersion: 0,
          txTipConfig: {
            address: new PublicKey(
              "5DAUjziKKSfiwW9V6s7MbVCiCK4bZr64rCbsnPpeqEwr"
            ),
            amount: new BN(0.1 * LAMPORTS_PER_SOL), // 0.05 SOL
          },
        });

        const { txId } = await execute({ sendAndConfirm: true });
        toast.success(`Liquidity removed successfully. Tx: ${txId}`);
        setIsModalOpen(false);
        plausible("remove");

        // Trigger refresh after 2 seconds
        setTimeout(() => {
          fetchPoolsWithSolPrice();
        }, 1000);
      } catch (error) {
        console.error("Error removing liquidity:", error);
        toast.error("Failed to remove liquidity. Please try again.");
      } finally {
        setIsRemoving(false);
      }
    };

    const profitLoss = calculateProfitLoss(poolInfo);
    console.log("Profit/Loss calculation result:", profitLoss);

    const usdValue =
      profitLoss && solPrice && profitLoss.tokenSymbol === "SOL"
        ? profitLoss.difference * solPrice
        : null;

    return (
      <div className="bg-neutral-800 p-4 sm:p-6 rounded-lg space-y-4 sm:space-y-6 w-full sm:w-[800px] relative">
        {/* Token Pair Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center -space-x-1">
              <img
                src={`https://img-v1.raydium.io/icon/${formatAddress(
                  poolInfo.mintA
                )}.png`}
                alt="Token A"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-neutral-700 border border-neutral-600"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-token.svg";
                  const parent = e.currentTarget.closest(".bg-neutral-800");
                  if (
                    parent &&
                    !parent.querySelector("#token-note-container .token-note")
                  ) {
                    const container = parent.querySelector(
                      "#token-note-container"
                    );
                    if (container) {
                      container.textContent =
                        "(Your token icon will display soon)";
                    }
                  }
                }}
              />
              <img
                src={`https://img-v1.raydium.io/icon/${formatAddress(
                  poolInfo.mintB
                )}.png`}
                alt="Token B"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-neutral-700 border border-neutral-600"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-token.svg";
                  const parent = e.currentTarget.closest(".bg-neutral-800");
                  if (
                    parent &&
                    !parent.querySelector("#token-note-container .token-note")
                  ) {
                    const container = parent.querySelector(
                      "#token-note-container"
                    );
                    if (container) {
                      container.textContent =
                        "(Your token icon will display soon)";
                    }
                  }
                }}
              />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {`${poolInfo.symbols.a}-${poolInfo.symbols.b}`}
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm">
                {formatAddress(poolInfo.mintA).slice(0, 4)}...
                {formatAddress(poolInfo.mintA).slice(-4)} -
                {formatAddress(poolInfo.mintB).slice(0, 4)}...
                {formatAddress(poolInfo.mintB).slice(-4)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* View on Photon Button */}
            <a
              href={`https://photon-sol.tinyastro.io/en/lp/${formatAddress(
                poolInfo.poolId
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors px-3 py-2 text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              <span className="">View on Photon</span>
            </a>
            {/* Minus Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Token icon note - positioned above Pool ID */}
        <div
          className="text-xs text-neutral-400"
          id="token-note-container"
        ></div>

        <div className="mb-2 text-xs sm:text-sm text-neutral-400 break-all">
          Pool ID:{" "}
          <span className="text-white">{formatAddress(poolInfo.poolId)}</span>
        </div>
        {/* Pool Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-neutral-400 text-sm mb-2">
              Pooled {poolInfo.symbols.a}
            </h3>
            <div className="flex items-center space-x-2">
              <img
                src={`https://img-v1.raydium.io/icon/${formatAddress(
                  poolInfo.mintA
                )}.png`}
                alt="Token A"
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-token.svg";
                  const parent = e.currentTarget.closest(".bg-neutral-800");
                  if (
                    parent &&
                    !parent.querySelector("#token-note-container .token-note")
                  ) {
                    const container = parent.querySelector(
                      "#token-note-container"
                    );
                    if (container) {
                      container.textContent =
                        "(Your token icon will display soon)";
                    }
                  }
                }}
              />
              <span className="text-white text-lg font-medium">
                {formatBN(poolInfo.vaultAAmount, poolInfo.mintDecimalA)}
              </span>
            </div>
          </div>

          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-neutral-400 text-sm mb-2">
              Pooled {poolInfo.symbols.b}
            </h3>
            <div className="flex items-center space-x-2">
              <img
                src={`https://img-v1.raydium.io/icon/${formatAddress(
                  poolInfo.mintB
                )}.png`}
                alt="Token B"
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-token.svg";
                  const parent = e.currentTarget.closest(".bg-neutral-800");
                  if (
                    parent &&
                    !parent.querySelector("#token-note-container .token-note")
                  ) {
                    const container = parent.querySelector(
                      "#token-note-container"
                    );
                    if (container) {
                      container.textContent =
                        "(Your token icon will display soon)";
                    }
                  }
                }}
              />
              <span className="text-white text-lg font-medium">
                {formatBN(poolInfo.vaultBAmount, poolInfo.mintDecimalB)}
              </span>
            </div>
          </div>

          {profitLoss && (
            <div className="bg-neutral-900 p-4 rounded-lg">
              <h3 className="text-neutral-400 text-sm mb-2">Profit/Loss</h3>
              <div
                className={`text-lg font-semibold ${
                  profitLoss.difference >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {usdValue !== null && (
                  <>
                    {profitLoss.difference >= 0 ? "+" : "-"}$
                    {Math.abs(usdValue).toFixed(2)} USD
                  </>
                )}
                <span className="text-sm ml-2">
                  ({profitLoss.difference >= 0 ? "+" : "-"}
                  {Math.abs(profitLoss.percentageChange).toFixed(2)}%)
                </span>
                <div className="text-sm text-neutral-400 mt-1">
                  ≈ {profitLoss.difference >= 0 ? "+" : "-"}
                  {Math.abs(profitLoss.difference).toFixed(2)}{" "}
                  {profitLoss.tokenSymbol}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Remove Liquidity Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 p-6 rounded-lg w-96">
              <h2 className="text-xl font-bold text-white mb-4">
                Remove Liquidity
              </h2>
              <p className="text-neutral-400 mb-2">
                LP Token Balance: {formatBN(lpBalance, poolInfo.lpDecimals)}
              </p>

              {/* Quick select percentage buttons */}
              <div className="flex gap-2 mb-4">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setRemovePercentage(percent)}
                    className={`flex-1 p-2 rounded text-sm font-medium transition-colors ${
                      removePercentage === percent
                        ? "bg-red-500 text-white"
                        : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={removePercentage}
                onChange={(e) => setRemovePercentage(parseInt(e.target.value))}
                className="w-full mb-4"
              />
              <p className="text-white mb-4">
                Remove {removePercentage}% of LP tokens
              </p>
              <button
                onClick={handleRemoveLiquidity}
                disabled={isRemoving || removePercentage === 0}
                className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
              >
                {isRemoving ? "Removing..." : "Remove Liquidity"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full p-2 mt-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const addCustomPool = async () => {
    if (!customTxId) return;

    try {
      const storedPools: StoredPool[] = JSON.parse(
        localStorage.getItem("createdPools") || "[]"
      );

      // Check if transaction ID already exists
      if (storedPools.some((pool) => pool.txId === customTxId)) {
        toast.info("This pool has already been added");
        return;
      }

      // Add new transaction ID to stored pools
      storedPools.push({
        poolId: "", // This will be populated when fetching pool info
        tokenA: "",
        tokenASymbol: "",
        tokenB: "",
        tokenBSymbol: "",
        creationDate: new Date().toISOString(),
        txId: customTxId,
      });
      localStorage.setItem("createdPools", JSON.stringify(storedPools));

      toast.success("Custom pool added successfully");
      setCustomTxId("");

      // Add a delay before refreshing the whole page
      setTimeout(() => {
        window.location.reload(); // This will refresh the entire page
      }, 2000); // 2 seconds delay
    } catch (error) {
      console.error("Error adding custom pool:", error);
      toast.error("Failed to add custom pool. Please try again.");
    }
  };

  if (!publicKey) {
    return (
      <div className="text-white">
        Please connect your wallet to view your Raydium pools.
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-[800px] mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Your Raydium Pools
        </h2>
        <button
          onClick={fetchPoolsWithSolPrice}
          disabled={loading}
          className="flex items-center rounded-lg hover:bg-indigo-600 transition-colors bg-indigo-500 px-3 py-2"
        >
          <svg
            className={`w-5 h-5 text-white mr-2 ${
              loading ? "animate-spin" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-white text-sm">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-white">Loading pools information...</div>
      ) : (
        <>
          {Object.values(poolsInfo)
            .filter(isValidPoolInfo)
            .filter((poolInfo) => !poolInfo.lpBalance.isZero())
            .map((poolInfo, index) => (
              <PoolCard key={index} poolInfo={poolInfo} />
            ))}
          {Object.values(poolsInfo)
            .filter(isValidPoolInfo)
            .filter((poolInfo) => !poolInfo.lpBalance.isZero()).length ===
            0 && (
            <div className="text-neutral-400">
              You don&apos;t have any active Raydium pools with liquidity on
              this address.
            </div>
          )}
        </>
      )}
      {/* Add custom pool input */}
      <div className="flex flex-col space-y-2 pt-8">
        <div className="text-neutral-400 text-sm">
          Can&apos;t find your pool? Add it manually:
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={customTxId}
            onChange={(e) => setCustomTxId(e.target.value)}
            placeholder="Enter pool creation transaction ID"
            className="flex-grow p-2 bg-neutral-700 text-white rounded"
          />
          <button
            onClick={addCustomPool}
            className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Add Custom Pool
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaydiumPoolsList;
