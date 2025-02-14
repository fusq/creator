import type { NextConfig } from "next";
import createNextJsObfuscator from "nextjs-obfuscator";

// Obfuscator configuration
const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: true,
  shuffleStringArray: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// Plugin options
const pluginOptions: { enabled: "detect" | boolean } & Partial<{
  patterns: string[];
  obfuscateFiles: {
    buildManifest: boolean;
    ssgManifest: boolean;
    webpack: boolean;
    additionalModules: string[];
  };
  log: boolean;
}> = {
  enabled: "detect", // Will be enabled only in production
  patterns: ["./**/*.(js|jsx|ts|tsx)"],
  obfuscateFiles: {
    buildManifest: true,
    ssgManifest: true,
    webpack: true,
    additionalModules: [] // Add any custom npm packages you want to obfuscate
  },
  log: false
};

const withNextJsObfuscator = createNextJsObfuscator(obfuscatorOptions, pluginOptions);

const nextConfig: NextConfig = withNextJsObfuscator({
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
});

export default nextConfig;
