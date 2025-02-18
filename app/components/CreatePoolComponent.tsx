import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

const CreatePoolComponent: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [mintA, setMintA] = useState(
    "8pVE9DGjAM1bHxcvfPQtBSBD4pcy3ceNz4KL5nFhe54x"
  );
  const [mintB, setMintB] = useState(
    "So11111111111111111111111111111111111111112"
  );
  const [amountA, setAmountA] = useState("900000000000000");
  const [amountB, setAmountB] = useState("0.15");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const createPool = async () => {
    if (!publicKey || !signTransaction) {
      alert("Please connect your wallet");
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
      const mintBInfo = await raydium.token.getTokenInfo(new PublicKey(mintB));

      const feeConfigs = await raydium.api.getCpmmConfigs();

      const { execute, extInfo } = await raydium.cpmm.createPool({
        programId: CREATE_CPMM_POOL_PROGRAM,
        poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
        mintA: mintAInfo,
        mintB: mintBInfo,
        mintAAmount: new BN(amountA),
        mintBAmount: new BN(parseFloat(amountB) * LAMPORTS_PER_SOL),
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
            "2feZsbAEjLuks5uAwunU8ZojySKisXsXcjVbyuLoHp4g"
          ),
          amount: new BN(0.05 * LAMPORTS_PER_SOL),
        },
      });

      console.log(extInfo);

      const { txId } = await execute({
        sendAndConfirm: true,
      });

      setResult(`Pool created successfully. Transaction ID: ${txId}`);
    } catch (error) {
      console.error("Error creating pool:", error);
      setResult(`Error creating pool: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-800 p-6 rounded-lg w-[600px] max-w-full">
      <h2 className="text-2xl font-bold mb-4 text-white">
        Create Raydium Liquidity Pool
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Token A Address
          </label>
          <input
            type="text"
            value={mintA}
            onChange={(e) => setMintA(e.target.value)}
            className="w-full p-2 bg-neutral-700 text-white rounded"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Token B Address (SOL)
          </label>
          <input
            type="text"
            value={mintB}
            onChange={(e) => setMintB(e.target.value)}
            className="w-full p-2 bg-neutral-700 text-white rounded"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Amount A
          </label>
          <input
            type="text"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            className="w-full p-2 bg-neutral-700 text-white rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Amount B (SOL)
          </label>
          <input
            type="text"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            className="w-full p-2 bg-neutral-700 text-white rounded"
          />
        </div>
        <button
          onClick={createPool}
          disabled={loading}
          className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {loading ? "Creating Pool..." : "Create Pool"}
        </button>
      </div>
      {result && <p className="mt-4 text-white">{result}</p>}
    </div>
  );
};

export default CreatePoolComponent;
