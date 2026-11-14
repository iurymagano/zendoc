import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // /pacientes virou /clientes (texto para qualquer tipo de negócio). Redirect
  // temporário mantém favoritos antigos funcionando; roda antes do proxy.ts.
  async redirects() {
    return [
      { source: '/pacientes', destination: '/clientes', permanent: false },
      { source: '/pacientes/:id', destination: '/clientes/:id', permanent: false },
    ];
  },
};

export default nextConfig;
