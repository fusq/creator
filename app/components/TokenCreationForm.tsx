"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Connection,
  Transaction,
  SystemProgram,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
type GtagFunction = (
  command: string,
  action: string,
  params: {
    send_to: string;
    value: number;
    currency: string;
    transaction_id: string;
    event_callback?: () => void;
  }
) => void;
// Extend Window interface
declare global {
  interface Window {
    gtag: GtagFunction;
  }
}
import Link from "next/link";
import Image from "next/image";
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
import { createClient } from "@supabase/supabase-js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ToastContainer, toast as toastify } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePlausible } from "next-plausible";

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

interface TokenInfo {
  tokenAddress: string;
  txId: string;
  name: string;
  symbol: string;
  totalSupply: string;
  creationDate: string;
  image: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CreatedTokensList = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    const storedTokens = JSON.parse(
      localStorage.getItem("createdTokens") || "[]"
    );
    // Sort tokens by creation date in descending order
    const sortedTokens = storedTokens.sort(
      (a: TokenInfo, b: TokenInfo) =>
        new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
    );
    setTokens(sortedTokens);
  }, [refreshTrigger]);

  const copyToClipboard = async (text: string, tokenAddress: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(tokenAddress);
      setTimeout(() => setCopySuccess(null), 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDeleteToken = (tokenAddress: string) => {
    const updatedTokens = tokens.filter(
      (token) => token.tokenAddress !== tokenAddress
    );
    localStorage.setItem("createdTokens", JSON.stringify(updatedTokens));
    setTokens(updatedTokens);
  };

  if (tokens.length === 0) return null;

  return (
    <div className="w-full max-w-[950px] mx-auto p-0 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 sm:mb-8 mt-12 sm:mt-0">
        Your Created Coins
      </h2>
      <div className="space-y-4 sm:space-y-6">
        {tokens.map((token, index) => (
          <div
            key={index}
            className="bg-neutral-800 rounded-lg p-4 sm:p-6 border border-neutral-700"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
              <div className="flex items-start space-x-4 mb-4 sm:mb-0">
                {token.image && (
                  <div className="flex-shrink-0">
                    <Image
                      src={token.image}
                      alt={token.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-white">
                    {token.name} ({token.symbol})
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm mt-1">
                    Created on{" "}
                    {new Date(token.creationDate).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-neutral-400 text-xs sm:text-sm">
                  Total Supply: {Number(token.totalSupply).toLocaleString()}
                </span>
                <button
                  onClick={() => handleDeleteToken(token.tokenAddress)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  title="Delete token"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <code className="flex-1 p-2 sm:p-3 bg-neutral-900 rounded-lg text-neutral-300 font-mono text-xs sm:text-sm break-all">
                {token.tokenAddress}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(token.tokenAddress, token.tokenAddress)
                }
                className="p-2 text-neutral-400 hover:text-white"
              >
                {copySuccess === token.tokenAddress ? (
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <Link
                href="/liquidity"
                onClick={() => {
                  localStorage.setItem("pendingPoolToken", token.tokenAddress);
                }}
                className="flex items-center justify-center space-x-2 p-3 bg-neutral-900 hover:bg-neutral-700 rounded-lg text-white transition-colors"
              >
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Create Liquidity Pool</span>
              </Link>

              <a
                href={`https://solscan.io/token/${token.tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 p-3 bg-neutral-900 hover:bg-neutral-700 rounded-lg text-white transition-colors"
              >
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
                href={`https://solscan.io/tx/${token.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 p-3 bg-neutral-900 hover:bg-neutral-700 rounded-lg text-white transition-colors"
              >
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>View Transaction</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TokenCreationForm = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isTransactionSubmitted, setIsTransactionSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [showCreatorInfo, setShowCreatorInfo] = useState(true);
  const [createdTokenInfo, setCreatedTokenInfo] = useState({
    tokenAddress: "",
    txId: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    symbol: "",
    totalSupply: "1000000000",
    creatorName: "MemeFast",
    creatorWebsite: "https://memefast.fun",
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const [devnetConnection, setDevnetConnection] = useState<Connection | null>(
    null
  );

  const [affiliateWallet, setAffiliateWallet] = useState<string | null>(null);

  const [refreshTokenList, setRefreshTokenList] = useState(0);

  const plausible = usePlausible();

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newConnection = new Connection(
      "https://mainnet.helius-rpc.com/?api-key=3212d845-480e-4b86-af4f-c8150ebb819a"
    );
    setDevnetConnection(newConnection);
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey && connection) {
        const balance = await connection.getBalance(publicKey);
        setUserBalance(balance / LAMPORTS_PER_SOL);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  // Function to validate Solana address
  const isValidSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      console.log("Valid Solana address:", address);
      return true;
    } catch {
      console.log("Invalid Solana address:", address);
      return false;
    }
  };

  // Function to store referral ID in localStorage
  const storeReferralId = (referralId: string) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    localStorage.setItem(
      "referralId",
      JSON.stringify({
        id: referralId,
        expiration: expirationDate.getTime(),
      })
    );
  };

  // Function to get stored referral ID from localStorage
  const getStoredReferralId = (): string | null => {
    const storedData = localStorage.getItem("referralId");
    if (storedData) {
      const { id, expiration } = JSON.parse(storedData);
      if (new Date().getTime() < expiration) {
        return id;
      } else {
        localStorage.removeItem("referralId");
      }
    }
    return null;
  };

  // Check for affiliate in URL or localStorage when component mounts
  useEffect(() => {
    const checkAffiliate = async () => {
      if (!publicKey) return; // Exit if wallet is not connected

      const urlParams = new URLSearchParams(window.location.search);
      const referralId = urlParams.get("r") || getStoredReferralId() || null;
      const storedReferralId = getStoredReferralId();
      console.log("storedReferralId:", storedReferralId);

      if (referralId) {
        console.log("referralId:", referralId);
        try {
          // Look up the affiliate's wallet address from their affiliate_id
          const { data, error } = await supabase
            .from("affiliates")
            .select("solana_address")
            .eq("affiliate_id", referralId)
            .single();

          // Only set affiliate wallet if we found a valid one and it's not the user's own wallet
          if (data && !error && isValidSolanaAddress(data.solana_address)) {
            const affiliateAddress = new PublicKey(data.solana_address);
            if (!publicKey.equals(affiliateAddress)) {
              setAffiliateWallet(data.solana_address);
              storeReferralId(referralId);
              console.log(
                "Affiliate wallet set to:",
                data.solana_address,
                referralId
              );
            } else {
              console.log("User attempted to use their own affiliate link");
              // still check if there is a already stored affiliate id
              const storedReferralId = getStoredReferralId();
              if (storedReferralId) {
                const { data: storedData, error: storedError } = await supabase
                  .from("affiliates")
                  .select("solana_address")
                  .eq("affiliate_id", storedReferralId)
                  .single();
                if (
                  storedReferralId &&
                  isValidSolanaAddress(storedData?.solana_address || "")
                ) {
                  console.log("Stored referral ID:", storedReferralId);
                  setAffiliateWallet(storedData?.solana_address || null);
                  console.log(
                    "Affiliate wallet set to:",
                    storedData?.solana_address || null
                  );
                }
                if (storedError) {
                  console.error(
                    "Error checking stored affiliate:",
                    storedError
                  );
                }
              }
            }
          } else {
            // If no valid affiliate found for ID, check local storage
            const storedReferralId = getStoredReferralId();
            if (storedReferralId) {
              const { data: storedData, error: storedError } = await supabase
                .from("affiliates")
                .select("solana_address")
                .eq("affiliate_id", storedReferralId)
                .single();

              if (
                storedData &&
                !storedError &&
                isValidSolanaAddress(storedData.solana_address)
              ) {
                setAffiliateWallet(storedData.solana_address);
                console.log(
                  "Affiliate wallet set from stored ID:",
                  storedData.solana_address
                );
              } else {
                setAffiliateWallet(null);
                console.log("No valid affiliate found in local storage");
              }
            } else {
              setAffiliateWallet(null);
              console.log("No valid affiliate found for ID:", referralId);
            }
          }
        } catch (error) {
          // In case of any error, just proceed without an affiliate
          console.error("Error checking affiliate:", error);
          setAffiliateWallet(null);
        }
      }
      console.log(
        "Affiliate wallet:",
        affiliateWallet,
        "referralId:",
        referralId,
        "storedReferralId:",
        storedReferralId
      );
    };

    checkAffiliate();
  }, [publicKey, affiliateWallet]); // Add publicKey as a dependency

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

      // Limit symbol to 8 characters without forcing uppercase
      if (name === "symbol") {
        newState.symbol = value.slice(0, 8);
      }

      // Reset creator info to defaults if customCreatorInfo is turned off
      if (name === "customCreatorInfo" && !checked) {
        newState.creatorName = "MemeFast";
        newState.creatorWebsite = "https://memefast.fun";
      }

      return newState;
    });
  };

  const handleCreatorInfoToggle = () => {
    setShowCreatorInfo(!showCreatorInfo);
    if (showCreatorInfo) {
      // Reset to default values when turning off
      setFormData((prev) => ({
        ...prev,
        creatorName: "MemeFast",
        creatorWebsite: "https://memefast.fun",
      }));
    }
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
      setIsImageUploading(true);
      const ipfsUrl = await uploadImageToIPFS(file);
      setFormData((prev) => ({ ...prev, image: ipfsUrl }));
    } catch (error) {
      console.error("Error handling file:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setIsImageUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
  });

  const showToast = (message: string, type: "error" | "success") => {
    if (type === "error") {
      toastify.error(message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      toastify.success(message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey || !signTransaction || !devnetConnection) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    // Calculate total SOL fee based on selected options
    const baseFee = 0.1; // Base fee for token creation
    const revokeMintFee = formData.revokeMint ? 0.1 : 0.1;
    const revokeFreezeFee = formData.revokeFreeze ? 0.1 : 0.1;
    const revokeUpdateFee = formData.revokeUpdateAuthority ? 0.1 : 0.1;
    const customCreatorInfoFee = showCreatorInfo ? 0.1 : 0; // Add fee for custom creator info
    const totalFee =
      baseFee +
      revokeMintFee +
      revokeFreezeFee +
      revokeUpdateFee +
      customCreatorInfoFee;

    // Add 0.02 SOL buffer for balance check
    const balanceCheckAmount = totalFee + 0.02;

    // Check if user has enough balance
    if (userBalance === null || userBalance < balanceCheckAmount) {
      showToast(
        `Insufficient balance. You need at least ${balanceCheckAmount.toFixed(
          2
        )} SOL to create this token. Please add more SOL or switch to a wallet with the necessary balance.`,
        "error"
      );
      return;
    }

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
          {
            trait_type: "Creator",
            value: showCreatorInfo ? formData.creatorName : "",
          },
          {
            trait_type: "Creator Website",
            value: showCreatorInfo ? formData.creatorWebsite : "",
          },
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

      // Always add revoke instructions for all authorities
      // Revoke Mint Authority
      const revokeMintAuthorityInstruction = createSetAuthorityInstruction(
        mintKeypair.publicKey,
        publicKey,
        AuthorityType.MintTokens,
        null
      );
      transaction.add(revokeMintAuthorityInstruction);

      // Revoke Freeze Authority
      const revokeFreezeAuthorityInstruction = createSetAuthorityInstruction(
        mintKeypair.publicKey,
        publicKey,
        AuthorityType.FreezeAccount,
        null
      );
      transaction.add(revokeFreezeAuthorityInstruction);

      // Modify the platform fee transfer instructions
      const platformWallet = new PublicKey(
        "CRaVELLWXZTmFV4ziVsCUdJ1XWa1jmzQmauo5KCg6WuF"
      );

      const totalFeeLamports = Math.floor(totalFee * LAMPORTS_PER_SOL);

      if (affiliateWallet) {
        // If there's an affiliate, split the fee
        const platformFee = Math.floor(totalFeeLamports * 0.5);
        const affiliateFee = totalFeeLamports - platformFee;

        const transferToPlatformInstruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: platformWallet,
          lamports: platformFee,
        });
        transaction.add(transferToPlatformInstruction);

        const transferToAffiliateInstruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(affiliateWallet),
          lamports: affiliateFee,
        });
        transaction.add(transferToAffiliateInstruction);
      } else {
        // If there's no affiliate, transfer the full fee to the platform
        const transferToPlatformInstruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: platformWallet,
          lamports: totalFeeLamports,
        });
        transaction.add(transferToPlatformInstruction);
      }

      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (
        await devnetConnection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction with both the wallet and mint keypair
      const signedTransaction = await signTransaction(transaction);
      signedTransaction.partialSign(mintKeypair);

      // Set transaction submitted flag right before sending the transaction
      setIsTransactionSubmitted(true);

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

      // After successful creation, update the state with token info
      const tokenInfo = {
        tokenAddress: mintKeypair.publicKey.toString(),
        txId: txid,
        name: formData.name,
        symbol: formData.symbol,
        totalSupply: formData.totalSupply,
        creationDate: new Date().toISOString(),
        image: formData.image,
      };

      setCreatedTokenInfo(tokenInfo);

      // Send Plausible event for successful token creation
      plausible("create");
      plausible("new", { revenue: { currency: "USD", amount: 56 } });

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "conversion", {
          send_to: "AW-764344438/ihcMCNLz258aEPbwu-wC",
          value: 1.0,
          currency: "EUR",
          transaction_id: txid,
        });
      }

      // Store token info in localStorage
      const existingTokens = JSON.parse(
        localStorage.getItem("createdTokens") || "[]"
      );
      existingTokens.unshift(tokenInfo);
      localStorage.setItem("createdTokens", JSON.stringify(existingTokens));
      localStorage.setItem("pendingPoolToken", tokenInfo.tokenAddress);
      setShowSuccessModal(true);
      setRefreshTokenList((prev) => prev + 1);

      // Reset only necessary state variables
      setIsLoading(false);
      setIsTransactionSubmitted(false);
      setCurrentStep(3);
    } catch (error: unknown) {
      console.error("Error creating token:", error);
      setIsLoading(false);
      if (error instanceof Error) {
        // Check for user rejection
        if (error.message.includes("User rejected")) {
          showToast("Transaction was rejected", "error");
        } else {
          showToast(`Error creating token: ${error.message}`, "error");
        }
      } else {
        showToast(
          "An unexpected error occurred while creating the token",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
      setIsTransactionSubmitted(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 sm:space-y-8 rounded-lg text-white bg-neutral-800">
      <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-6 sm:space-y-0">
        <div className="flex-1">
          <label
            htmlFor="name"
            className="block text-sm sm:text-base font-medium mb-2"
          >
            <span className="text-red-500">*</span> Token Name
          </label>
          <input
            ref={nameInputRef}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Meme Coin"
            disabled={!connected || !publicKey}
            maxLength={32}
            className="p-2 sm:p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
          />
          <p className="mt-1 text-xs text-gray-400">(max 32 characters)</p>
        </div>
        <div className="flex-1">
          <label
            htmlFor="symbol"
            className="block text-sm sm:text-base font-medium mb-2"
          >
            <span className="text-red-500">*</span> Token Symbol
          </label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            required
            maxLength={8}
            placeholder="MEMC"
            disabled={!connected || !publicKey}
            className="p-2 sm:p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
          />
          <p className="mt-1 text-xs text-gray-400">(max 8 characters)</p>
        </div>
      </div>
      <div>
        <label className="block text-sm sm:text-base font-medium mb-2">
          <span className="text-red-500">*</span> Image
        </label>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-12 cursor-pointer hover:border-indigo-500 transition-colors min-h-[150px] sm:min-h-[200px] flex items-center justify-center"
        >
          <input {...getInputProps()} />
          {isImageUploading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mt-2 text-neutral-400">Uploading image...</p>
            </div>
          ) : imagePreview ? (
            <div className="w-full flex flex-col items-center justify-center">
              <Image
                src={imagePreview}
                alt="Preview"
                className="max-h-24 rounded-lg"
                width={100}
                height={100}
              />
              <p className="mt-2 text-sm text-neutral-400">
                {acceptedFiles[0]?.name || ""}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-1 text-sm text-neutral-400">
                Click or drag to upload your token logo (500x500)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 sm:space-y-8 text-white rounded-lg bg-neutral-800">
      <div>
        <label
          htmlFor="totalSupply"
          className="block text-sm sm:text-base font-medium mb-2"
        >
          <span className="text-red-500">*</span> Total Supply
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
          className="p-2 sm:p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
        />
        <p className="mt-2 text-xs sm:text-sm text-neutral-400">
          1 billion by default (recommended), 6 decimals
        </p>
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm sm:text-base font-medium mb-2"
        >
          <span className="text-red-500">*</span> Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={6}
          disabled={!connected || !publicKey}
          className="p-2 sm:p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
          placeholder="Describe your token's purpose and vision..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 sm:space-y-8 text-white rounded-lg bg-neutral-800">
      {/* Creator Info Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">
            Modify Creator Information
          </h3>
          <p className="text-sm text-neutral-400">
            Change the creator details in token metadata (+0.1 SOL)
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showCreatorInfo}
          onClick={handleCreatorInfoToggle}
          className={`${
            showCreatorInfo ? "bg-indigo-600" : "bg-neutral-700"
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
        >
          <span
            aria-hidden="true"
            className={`${
              showCreatorInfo ? "translate-x-5" : "translate-x-0"
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>

      {showCreatorInfo && (
        <div className="space-y-4 border border-neutral-700 rounded-lg p-6">
          <div>
            <label
              htmlFor="creatorName"
              className="block text-base font-medium mb-2"
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
              className="p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label
              htmlFor="creatorWebsite"
              className="block text-base font-medium mb-2"
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
              className="p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      )}

      {/* Social Links Toggle */}
      <div className="flex items-center justify-between mt-8">
        <div>
          <h3 className="text-lg font-medium text-white">Add Social Links</h3>
          <p className="text-sm text-neutral-400">
            Show social media links for your token
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showSocialLinks}
          onClick={() => setShowSocialLinks(!showSocialLinks)}
          className={`${
            showSocialLinks ? "bg-indigo-600" : "bg-neutral-700"
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
        >
          <span
            aria-hidden="true"
            className={`${
              showSocialLinks ? "translate-x-5" : "translate-x-0"
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>

      {showSocialLinks && (
        <>
          <div className="space-y-4 border border-neutral-700 rounded-lg p-6">
            <div>
              <label
                htmlFor="website"
                className="block text-base font-medium mb-2"
              >
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
                className="p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
            </div>
            <div>
              <label
                htmlFor="twitter"
                className="block text-base font-medium mb-2"
              >
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
                className="p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
            </div>
            <div>
              <label
                htmlFor="telegram"
                className="block text-base font-medium mb-2"
              >
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
                className="p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
            </div>
            <div>
              <label
                htmlFor="discord"
                className="block text-base font-medium mb-2"
              >
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
                className="p-3 block w-full rounded-md bg-neutral-700 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
            </div>
          </div>
        </>
      )}
      <div className="mt-12">
        <h3 className="text-lg font-medium text-white mb-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"
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
                    : "bg-neutral-700 text-neutral-400"
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
                    : "bg-neutral-700 text-neutral-400"
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
                    : "bg-neutral-700 text-neutral-400"
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
    if (!connected) {
      return (
        <div className="text-center p-8 bg-neutral-800 rounded-lg border border-neutral-700">
          <p className="text-xl text-white mb-4">
            Please connect your wallet to create a token
          </p>
          <WalletMultiButton className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base">
            Connect Wallet
          </WalletMultiButton>
        </div>
      );
    }

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
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-8 w-full max-w-[900px] mx-auto sm:mt-14 sm:mb-8 p-4 sm:p-10 border border-neutral-700 rounded-lg bg-neutral-800"
      >
        {!connected ? (
          <div className="text-center p-4 sm:p-8 bg-neutral-800 rounded-lg border border-neutral-700">
            <p className="text-lg sm:text-xl text-white mb-4">
              Please connect your wallet to create a token
            </p>
            <WalletMultiButton className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base">
              Connect Wallet
            </WalletMultiButton>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Step {currentStep} of 3
                </h2>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {renderStepContent()}

            <div className="flex flex-col sm:flex-row justify-between sm:mt-8 sm:pb-0 space-y-0 sm:space-y-0">
              <div className="w-full sm:w-auto order-2 sm:order-1 mt-4 sm:mt-0">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto px-4 py-2 border border-neutral-300 rounded-md shadow-sm font-medium text-neutral-300 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm sm:text-base flex items-center justify-center sm:justify-start space-x-2"
                  >
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span>Back</span>
                  </button>
                )}
              </div>
              <div className="w-full sm:w-auto order-1 sm:order-2">
                {currentStep < 3 && (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center space-x-2"
                  >
                    <span>Next</span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
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
                    className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center space-x-2 relative"
                  >
                    {isLoading ? (
                      <>
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Submitting Transaction...</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-lg">Create Token</span>
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </form>

      {/* Loading Overlay - Only show after transaction is submitted */}
      {isLoading && isTransactionSubmitted && (
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
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-indigo-900 rounded-2xl p-6 sm:p-8 max-w-lg w-full relative">
            <button
              onClick={() => {
                setShowSuccessModal(false);
              }}
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
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-neutral-900 rounded-lg text-neutral-300 font-mono text-xs sm:text-sm break-all">
                    {createdTokenInfo.tokenAddress}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(createdTokenInfo.tokenAddress)
                    }
                    className="p-2 text-neutral-400 hover:text-white flex-shrink-0"
                  >
                    {copySuccess ? (
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

      {/* Modify the CreatedTokensList component call */}
      <CreatedTokensList refreshTrigger={refreshTokenList} />

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
    </>
  );
};
