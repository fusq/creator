import React from "react";

const GuideFaq: React.FC = () => {
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

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              What is Solana, and why should I launch my token on it?
            </h3>
            <p className="text-neutral-400">
              Solana is a high-performance blockchain platform known for its
              fast transactions, low fees, and scalability. It&apos;s an
              excellent choice for launching tokens due to its growing
              ecosystem, strong developer community, and widespread adoption in
              the crypto space.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              How can I create a token on the Solana blockchain?
            </h3>
            <p className="text-neutral-400">
              Creating a token on Solana is straightforward with our platform.
              Simply connect your wallet, fill in your token details (name,
              symbol, supply, etc.), customize settings if needed, and submit.
              Our tool handles all the technical aspects of token creation for
              you.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              What are the steps to deploy my own token on Solana?
            </h3>
            <p className="text-neutral-400">
              The process involves: 1) Connecting your Solana wallet, 2)
              Providing token details like name and symbol, 3) Setting the
              supply and decimals, 4) Uploading token image and metadata, 5)
              Configuring optional settings like freeze authority, and 6)
              Confirming the transaction. Our platform guides you through each
              step.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              How can I manage token authorities on Solana?
            </h3>
            <p className="text-neutral-400">
              Token authorities on Solana can be managed through our platform.
              You can set and revoke different authorities like freeze, mint,
              and update authority during token creation. These settings
              determine who can perform certain actions with your token after
              deployment.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              What platforms can assist with launching a token on Solana?
            </h3>
            <p className="text-neutral-400">
              There are several platforms available, including MemeFast (our
              platform), which provides a user-friendly interface for token
              creation. Other options include Solana&apos;s CLI tools and
              various development frameworks, but our platform offers the most
              straightforward solution for non-technical users.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuideFaq;
