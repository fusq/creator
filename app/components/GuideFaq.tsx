import React, { useState } from "react";

const GuideFaq: React.FC = () => {
  // Add state for managing open/closed states of FAQ items
  const [openItems, setOpenItems] = useState<number[]>([]);

  // Toggle function for FAQ items
  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <>
      {/* How to use guide */}
      <div className="w-[862px] bg-neutral-800 rounded-2xl p-12 mb-16 mt-8 border border-neutral-700">
        <h2 className="text-2xl font-semibold text-white mb-8">
          How to use Solana Token Creator
        </h2>

        <h3 className="text-lg text-white mb-6">Follow these simple steps:</h3>

        <ol className="list-decimal list-inside space-y-4 text-lg text-white ml-4">
          <li>Connect your Solana wallet.</li>
          <li>Write the name you want for your Token.</li>
          <li>Indicate the symbol (max 8 characters).</li>
          <li>Write the description you want for your SPL Token.</li>
          <li>Upload the image for your token (PNG).</li>
          <li>Put the supply of your Token.</li>
          <li>
            Click on Create, accept the transaction, and wait until your token
            is ready.
          </li>
        </ol>

        <div className="mt-8 space-y-4 text-base">
          <p className="text-white">
            The cost of creating the Token is{" "}
            <span className="text-[#7dd3fc]">0.1 SOL</span>, which includes all
            fees needed for the SPL Token creation.
          </p>
          <p className="text-white">
            The creation process will start and will take some seconds. After
            that, you will receive the total supply of the token in the wallet
            you chose.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="w-[862px] bg-neutral-800 rounded-2xl p-12 mb-16 border border-neutral-700">
        <h2 className="text-2xl font-semibold text-white mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {[
            {
              question:
                "What is Solana, and why should I launch my token on it?",
              answer:
                "Solana is a high-performance blockchain platform known for its fast transactions, low fees, and scalability. It's an excellent choice for launching tokens due to its growing ecosystem, strong developer community, and widespread adoption in the crypto space.",
            },
            {
              question: "How can I create a token on the Solana blockchain?",
              answer:
                "Creating a token on Solana is straightforward with our platform. Simply connect your wallet, fill in your token details (name, symbol, supply, etc.), customize settings if needed, and submit. Our tool handles all the technical aspects of token creation for you.",
            },
            {
              question: "What are the steps to deploy my own token on Solana?",
              answer:
                "The process involves: 1) Connecting your Solana wallet, 2) Providing token details like name and symbol, 3) Setting the supply and decimals, 4) Uploading token image and metadata, 5) Configuring optional settings like freeze authority, and 6) Confirming the transaction. Our platform guides you through each step.",
            },
            {
              question: "How can I manage token authorities on Solana?",
              answer:
                "Token authorities on Solana can be managed through our platform. You can set and revoke different authorities like freeze, mint, and update authority during token creation. These settings determine who can perform certain actions with your token after deployment.",
            },
            {
              question:
                "What platforms can assist with launching a token on Solana?",
              answer:
                "There are several platforms available, including CoinBuilder.io (our platform), which provides a user-friendly interface for token creation. Other options include Solana's CLI tools and various development frameworks, but our platform offers the most straightforward solution for non-technical users, without any coding required.",
            },
          ].map((faq, index) => (
            <div key={index} className="border border-neutral-700 rounded-lg">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 flex justify-between items-center text-left"
              >
                <h3 className="text-lg font-medium text-white">
                  {faq.question}
                </h3>
                <svg
                  className={`w-6 h-6 transform transition-transform ${
                    openItems.includes(index) ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                    className="text-white"
                  />
                </svg>
              </button>
              {openItems.includes(index) && (
                <div className="px-6 pb-4">
                  <p className="text-neutral-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default GuideFaq;
