import type { NextConfig } from "next";

// Node 25 can expose a bare localStorage object without the standard methods,
// which breaks Next dev overlay. Patch it to an in-memory implementation when
// the methods are missing.
if (typeof globalThis !== "undefined") {
  const ls = (globalThis as any).localStorage;
  const needsPolyfill =
    ls && (typeof ls.getItem !== "function" || typeof ls.setItem !== "function");
  if (needsPolyfill) {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    };
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "ovco9b5jyh.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
