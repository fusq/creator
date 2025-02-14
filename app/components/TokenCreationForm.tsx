import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Connection,
  Transaction,
  SystemProgram,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  Metaplex,
  IdentitySigner,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  MINT_SIZE,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Buffer } from "buffer";
import axios from "axios";
import { useDropzone } from "react-dropzone";

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  creator: {
    name: string;
    site: string;
  };
  tags: string[];
  image: string;
}

export const TokenCreationForm = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "test",
    description: "tearctaertc",
    image: "",
    symbol: "test",
    totalSupply: "1000000",
  });
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadImageToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY!,
        },
      }
    );

    return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
  };

  const uploadMetadataToIPFS = async (
    metadata: TokenMetadata
  ): Promise<string> => {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY!,
        },
      }
    );

    return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const file = acceptedFiles[0];
      if (!file) return;

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);

      // Upload to IPFS
      setIsLoading(true);
      const ipfsUrl = await uploadImageToIPFS(file);
      setFormData((prev) => ({ ...prev, image: ipfsUrl }));
      setIsLoading(false);
    } catch (error) {
      console.error("Error handling file:", error);
      alert("Error uploading image. Please try again.");
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!connected || !publicKey || !signTransaction || !devnetConnection) {
      alert("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      // Create metadata JSON
      const metadata: TokenMetadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        creator: {
          name: "Test",
          site: "https://google.com",
        },
        tags: [],
        image: formData.image,
      };

      // Upload metadata to IPFS
      const metadataUri = await uploadMetadataToIPFS(metadata);
      console.log("Metadata uploaded to IPFS:", metadataUri);

      const metaplex = Metaplex.make(devnetConnection);
      const wallet: IdentitySigner = {
        publicKey: publicKey,
        signTransaction: async (tx: Transaction) => signTransaction(tx),
        signAllTransactions: async (txs: Transaction[]) => {
          return Promise.all(txs.map((tx) => signTransaction(tx)));
        },
        signMessage: async (message: Uint8Array) => {
          return message;
        },
      };

      metaplex.use(walletAdapterIdentity(wallet));

      // Generate a new keypair for the mint account
      const mintKeypair = Keypair.generate();

      // Calculate the rent-exempt balance
      const rentExemptBalance =
        await devnetConnection.getMinimumBalanceForRentExemption(MINT_SIZE);

      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );

      // Get metadata PDA for the mint
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Create a single transaction with all instructions
      const transaction = new Transaction();

      // Add System Program createAccount instruction
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: rentExemptBalance,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Add initialize mint instruction
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          6, // Decimals
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        )
      );

      // Get the token account address
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        publicKey
      );

      // Add create token account instruction
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          tokenAccount,
          publicKey,
          mintKeypair.publicKey
        )
      );

      // Add mint to instruction for initial supply (1 million tokens with 6 decimals)
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          tokenAccount,
          publicKey,
          1_000_000_000_000 // 1 million tokens with 6 decimals
        )
      );

      // Add create metadata instruction
      const builder = await metaplex.nfts().builders().create({
        uri: metadataUri,
        name: formData.name,
        symbol: formData.symbol,
        sellerFeeBasisPoints: 0,
        useNewMint: mintKeypair,
        tokenStandard: 2, // Fungible token
        isMutable: true,
      });

      const createMetadataInstruction = builder.getInstructions()[0];
      transaction.add(createMetadataInstruction);

      // Add transfer instruction of 0.1 SOL
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey("BVZfAN6Fmws2scytd6V7TySDWSm1DZFCVXbUfHLSqdpi"),
        lamports: 0.1 * LAMPORTS_PER_SOL,
      });
      transaction.add(transferInstruction);

      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (
        await devnetConnection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction with both the wallet and mint keypair
      const signedTransaction = await signTransaction(transaction);
      signedTransaction.partialSign(mintKeypair);

      // Send and confirm the transaction
      const txid = await devnetConnection.sendRawTransaction(
        signedTransaction.serialize()
      );
      await devnetConnection.confirmTransaction(txid);

      console.log("Token created successfully!");
      console.log("Token mint address:", mintKeypair.publicKey.toString());
      console.log("Token metadata address:", metadataPDA.toString());
      console.log(
        "0.1 SOL transferred to BVZfAN6Fmws2scytd6V7TySDWSm1DZFCVXbUfHLSqdpi"
      );

      setFormData({
        name: "",
        description: "",
        image: "",
        symbol: "",
        totalSupply: "",
      });

      alert(
        `Token created successfully! Token mint address: ${mintKeypair.publicKey.toString()}`
      );
    } catch (error: unknown) {
      console.error("Error creating token:", error);
      if (error instanceof Error) {
        alert(`Error creating token: ${error.message}`);
      } else {
        alert(`An unexpected error occurred while creating the token.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-8">
      {!connected && (
        <div className="text-center p-4 bg-yellow-100 text-yellow-700 rounded-md mb-4">
          Please connect your wallet to create a token
        </div>
      )}
      {connected && !publicKey && (
        <div className="text-center p-4 bg-red-100 text-red-700 rounded-md mb-4">
          Wallet connected, but public key is not available. Please try
          reconnecting your wallet.
        </div>
      )}
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-500 transition-colors"
      >
        <input {...getInputProps()} />
        <div className="text-center">
          {isDragActive ? (
            <p className="text-indigo-500">Drop the image here ...</p>
          ) : (
            <p>Drag and drop an image here, or click to select one</p>
          )}
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-40 mx-auto"
              />
            </div>
          )}
          {formData.image && (
            <p className="mt-2 text-sm text-gray-500">
              IPFS URL: {formData.image}
            </p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Token Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={!connected || !publicKey}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          disabled={!connected || !publicKey}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label
          htmlFor="symbol"
          className="block text-sm font-medium text-gray-700"
        >
          Symbol
        </label>
        <input
          type="text"
          id="symbol"
          name="symbol"
          value={formData.symbol}
          onChange={handleChange}
          required
          disabled={!connected || !publicKey}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label
          htmlFor="totalSupply"
          className="block text-sm font-medium text-gray-700"
        >
          Total Supply
        </label>
        <input
          type="number"
          id="totalSupply"
          name="totalSupply"
          value={formData.totalSupply}
          onChange={handleChange}
          required
          min="1"
          disabled={!connected || !publicKey}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={!connected || !publicKey || isLoading || !formData.image}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating Token..." : "Create Token"}
        </button>
      </div>
    </form>
  );
};
