import path from 'node:path';

// All env lives in the repo root .env so both apps and the seed script share it.
try { process.loadEnvFile(path.join(import.meta.dirname, '../../.env')); } catch {}

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ['@enjaz/core'],
  serverExternalPackages: ['mysql2'],
  poweredByHeader: false,
};
