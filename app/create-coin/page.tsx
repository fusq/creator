import { TokenCreationForm } from "../components/TokenCreationForm";
import GuideFaq from "../components/GuideFaq";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-neutral-900">
      <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-white bg-indigo-600 px-4 py-2 rounded-lg Lexend text-center">
        Create Your Own Coin FAST ⚡
      </h1>
      <p className="text-base sm:text-lg text-neutral-400 text-center mb-6 sm:mb-0">
        Launch your own coin on Solana in seconds. No coding required.
      </p>
      <TokenCreationForm />
      <GuideFaq />
    </main>
  );
}
