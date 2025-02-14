import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
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
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { Buffer } from "buffer";
import axios from "axios";
import { useDropzone } from "react-dropzone";

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  properties: {
    files: {
      uri: string;
      type: string;
    }[];
    category: string;
    creators: {
      address: string;
      share: number;
    }[];
  };
  external_url: string;
}

export const TokenCreationForm = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    symbol: "",
    totalSupply: "1000000000",
    creatorName: "Creator Name",
    creatorWebsite: "https://creatorwebsite.com",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    revokeMint: true,
    revokeFreeze: true,
    revokeUpdateAuthority: true,
    customCreatorInfo: true,
  });
  const [imagePreview, setImagePreview] = useState<string>("");

  const [devnetConnection, setDevnetConnection] = useState<Connection | null>(
    null
  );

  useEffect(() => {
    const newConnection = new Connection(
      "https://mainnet.helius-rpc.com/?api-key=3212d845-480e-4b86-af4f-c8150ebb819a"
    );
    setDevnetConnection(newConnection);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newState = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Reset creator info to defaults if customCreatorInfo is turned off
      if (name === "customCreatorInfo" && !checked) {
        newState.creatorName = "Creator Name";
        newState.creatorWebsite = "https://creatorwebsite.com";
      }

      return newState;
    });
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

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
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

    // Calculate total SOL fee based on selected options
    const baseFee = 0.1; // Base fee for token creation
    const revokeMintFee = formData.revokeMint ? 0.1 : 0;
    const revokeFreezeFee = formData.revokeFreeze ? 0.1 : 0;
    const revokeUpdateFee = formData.revokeUpdateAuthority ? 0.1 : 0;
    const customCreatorInfoFee = formData.customCreatorInfo ? 0.1 : 0;
    const totalFee =
      baseFee +
      revokeMintFee +
      revokeFreezeFee +
      revokeUpdateFee +
      customCreatorInfoFee;

    setIsLoading(true);
    try {
      // Create metadata JSON
      const metadata: TokenMetadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: formData.image,
        decimals: 6,
        attributes: [
          { trait_type: "Creator", value: formData.creatorName },
          { trait_type: "Creator Website", value: formData.creatorWebsite },
          { trait_type: "Website", value: formData.website },
          { trait_type: "Twitter", value: formData.twitter },
          { trait_type: "Telegram", value: formData.telegram },
          { trait_type: "Discord", value: formData.discord },
        ],
        properties: {
          files: [
            {
              uri: formData.image,
              type: "image/png", // Assuming PNG, adjust if needed
            },
          ],
          category: "image",
          creators: [
            {
              address: publicKey.toString(),
              share: 100,
            },
          ],
        },
        external_url: formData.website,
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
          6, // Decimals (already set to 6)
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

      // Add mint to instruction for initial supply (using the total supply from form data)
      const totalSupplyBigInt = BigInt(
        Number(formData.totalSupply) * Math.pow(10, 6)
      ); // Convert to smallest units (6 decimals)
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          tokenAccount,
          publicKey,
          totalSupplyBigInt
        )
      );

      console.log(
        `Minting ${formData.totalSupply} tokens with 6 decimal places`
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

      // Add transfer instruction with dynamic SOL amount
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey("BVZfAN6Fmws2scytd6V7TySDWSm1DZFCVXbUfHLSqdpi"),
        lamports:
          baseFee * LAMPORTS_PER_SOL +
          (formData.revokeMint ? 0.1 * LAMPORTS_PER_SOL : 0) +
          (formData.revokeFreeze ? 0.1 * LAMPORTS_PER_SOL : 0) +
          (formData.revokeUpdateAuthority ? 0.1 * LAMPORTS_PER_SOL : 0) +
          (formData.customCreatorInfo ? 0.1 * LAMPORTS_PER_SOL : 0),
      });
      transaction.add(transferInstruction);

      // Add revoke instructions based on checkbox selections
      if (formData.revokeMint) {
        const revokeMintAuthorityInstruction = createSetAuthorityInstruction(
          mintKeypair.publicKey,
          publicKey,
          AuthorityType.MintTokens,
          null
        );
        transaction.add(revokeMintAuthorityInstruction);
      }

      if (formData.revokeFreeze) {
        const revokeFreezeAuthorityInstruction = createSetAuthorityInstruction(
          mintKeypair.publicKey,
          publicKey,
          AuthorityType.FreezeAccount,
          null
        );
        transaction.add(revokeFreezeAuthorityInstruction);
      }

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
      if (formData.revokeMint) console.log("Mint authority has been revoked");
      if (formData.revokeFreeze)
        console.log("Freeze authority has been revoked");
      console.log(
        `${totalFee.toFixed(
          1
        )} SOL transferred to BVZfAN6Fmws2scytd6V7TySDWSm1DZFCVXbUfHLSqdpi`
      );

      setFormData({
        name: "",
        description: "",
        image: "",
        symbol: "",
        totalSupply: "1000000000",
        creatorName: "Creator Name",
        creatorWebsite: "https://creatorwebsite.com",
        website: "",
        twitter: "",
        telegram: "",
        discord: "",
        revokeMint: true,
        revokeFreeze: true,
        revokeUpdateAuthority: true,
        customCreatorInfo: true,
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

  const renderStep1 = () => (
    <div className="space-y-8 border border-neutral-600 rounded-lg p-8 text-white">
      <div className="flex space-x-6">
        <div className="flex-1">
          <label htmlFor="name" className="block text-base font-medium mb-2">
            Token Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Meme Coin"
            disabled={!connected || !publicKey}
            className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="symbol" className="block text-base font-medium mb-2">
            Token Symbol
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            required
            placeholder="MEMC"
            disabled={!connected || !publicKey}
            className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
          />
        </div>
      </div>
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:border-indigo-500 transition-colors min-h-[200px] flex items-center justify-center"
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-2 text-neutral-400">Uploading image...</p>
          </div>
        ) : imagePreview ? (
          <div className="w-full flex flex-col items-center justify-center">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-24 rounded-lg"
            />
            <p className="mt-2 text-sm text-neutral-400">
              {acceptedFiles[0]?.name || ""}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-neutral-400">
              Click or drag to upload logo (500x500)
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 text-white border border-neutral-600 rounded-lg p-8">
      <div>
        <label
          htmlFor="totalSupply"
          className="block text-base font-medium mb-2"
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
          className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
        />
        <p className="mt-2 text-sm text-neutral-400">
          1 billion by default (recommended), 6 decimals
        </p>
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-base font-medium mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={6}
          disabled={!connected || !publicKey}
          className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
          placeholder="Describe your token's purpose and vision..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 text-white border border-neutral-600 rounded-lg p-8">
      <div>
        <label htmlFor="website" className="block text-base font-medium mb-2">
          Token Website (Optional)
        </label>
        <input
          type="url"
          id="website"
          name="website"
          placeholder="https://yourmemecoin.fun"
          value={formData.website}
          onChange={handleChange}
          disabled={!connected || !publicKey}
          className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
        />
      </div>
      <div>
        <label htmlFor="twitter" className="block text-base font-medium mb-2">
          Twitter (Optional)
        </label>
        <input
          type="url"
          id="twitter"
          name="twitter"
          placeholder="https://twitter.com/yourmemecoin"
          value={formData.twitter}
          onChange={handleChange}
          disabled={!connected || !publicKey}
          className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
        />
      </div>
      <div>
        <label htmlFor="telegram" className="block text-base font-medium mb-2">
          Telegram (Optional)
        </label>
        <input
          type="url"
          id="telegram"
          name="telegram"
          placeholder="https://t.me/yourchannel"
          value={formData.telegram}
          onChange={handleChange}
          disabled={!connected || !publicKey}
          className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
        />
      </div>
      <div>
        <label htmlFor="discord" className="block text-base font-medium mb-2">
          Discord (Optional)
        </label>
        <input
          type="url"
          id="discord"
          name="discord"
          placeholder="https://discord.gg/your-server"
          value={formData.discord}
          onChange={handleChange}
          disabled={!connected || !publicKey}
          className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
        />
      </div>
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-medium text-white">
              Modify Creator Information
            </h3>
            <span className="text-neutral-400">(+0.1 SOL)</span>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="customCreatorInfo"
              name="customCreatorInfo"
              checked={formData.customCreatorInfo}
              onChange={handleChange}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
        </div>
        <p className="text-neutral-400 mb-6">
          Change the information of the creator in the metadata. By default, it
          is CoinFast.
        </p>

        {formData.customCreatorInfo && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="creatorName"
                className="block text-base font-medium mb-2 text-white"
              >
                Creator Name
              </label>
              <input
                type="text"
                id="creatorName"
                name="creatorName"
                value={formData.creatorName}
                onChange={handleChange}
                required
                disabled={!connected || !publicKey}
                className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
            </div>
            <div>
              <label
                htmlFor="creatorWebsite"
                className="block text-base font-medium mb-2 text-white"
              >
                Creator Website
              </label>
              <input
                type="url"
                id="creatorWebsite"
                name="creatorWebsite"
                value={formData.creatorWebsite}
                onChange={handleChange}
                required
                disabled={!connected || !publicKey}
                className="p-3 block w-full rounded-md bg-neutral-800 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
            </div>
          </div>
        )}
      </div>
      <div className="mt-12">
        <h3 className="text-xl font-medium text-white mb-4">
          Revoke Authorities (Selected by Default)
        </h3>
        <p className="text-neutral-400 mb-6">
          Solana Token has 3 authorities: Freeze Authority, Mint Authority, and
          Update Authority. Revoke them to attract more investors. We highly
          recommend enabling these 3 options for gaining more trust.
        </p>
        <p className="text-neutral-400 mb-6">
          *All 3 options are pre-selected by default, unselect them to turn them
          off.
        </p>

        <div className="grid grid-cols-3 gap-6">
          <div className="border border-neutral-600 rounded-lg p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-indigo-500">+0.1 SOL</span>
            </div>
            <div className="text-base font-medium text-white mb-2">
              Revoke Freeze
            </div>
            <p className="text-neutral-400 mb-4">
              Freeze Authority allows you to freeze token accounts of holders.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  handleChange({
                    target: {
                      name: "revokeFreeze",
                      checked: !formData.revokeFreeze,
                      type: "checkbox",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className={`w-full py-2 px-4 rounded-md ${
                  formData.revokeFreeze
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {formData.revokeFreeze ? "Selected" : "Unselected"}
              </button>
            </div>
          </div>
          <div className="border border-neutral-600 rounded-lg p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-indigo-500"
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
              </div>

              <span className="text-indigo-500">+0.1 SOL</span>
            </div>
            <div className="text-base font-medium text-white mb-2">
              Revoke Mint
            </div>
            <p className="text-neutral-400 mb-4">
              Mint Authority allows you to mint more supply of your token.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  handleChange({
                    target: {
                      name: "revokeMint",
                      checked: !formData.revokeMint,
                      type: "checkbox",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className={`w-full py-2 px-4 rounded-md ${
                  formData.revokeMint
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {formData.revokeMint ? "Selected" : "Unselected"}
              </button>
            </div>
          </div>
          <div className="border border-neutral-600 rounded-lg p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <span className="text-indigo-500">+0.1 SOL</span>
            </div>
            <div className="text-base font-medium text-white mb-2">
              Revoke Update
            </div>
            <p className="text-neutral-400 mb-4">
              Update Authority allows you to update the token metadata about
              your token.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  handleChange({
                    target: {
                      name: "revokeUpdateAuthority",
                      checked: !formData.revokeUpdateAuthority,
                      type: "checkbox",
                    },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className={`w-full py-2 px-4 rounded-md ${
                  formData.revokeUpdateAuthority
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {formData.revokeUpdateAuthority ? "Selected" : "Unselected"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.symbol && formData.image;
      case 2:
        return formData.totalSupply && formData.description;
      case 3:
        return true; // Remove website requirement since social fields are optional
      default:
        return false;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 w-[900px] mx-auto mt-8 p-6 mb-16"
    >
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

      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium text-white">
            Step {currentStep} of 3
          </h2>
        </div>
        <div className="h-3 bg-gray-200 rounded-full">
          <div
            className="h-3 bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {renderStepContent()}

      <div className="flex justify-between mt-8">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 border border-neutral-300 rounded-md shadow-sm font-medium text-neutral-300 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-base"
            >
              Back
            </button>
          )}
        </div>
        <div>
          {currentStep < 3 && (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
            >
              Next
            </button>
          )}
          {currentStep === 3 && (
            <button
              type="submit"
              disabled={
                !connected ||
                !publicKey ||
                isLoading ||
                !formData.image ||
                !canProceed()
              }
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
            >
              {isLoading ? "Creating Token..." : "Create Token"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
