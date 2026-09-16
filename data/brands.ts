export type BrandId = "chatgpt" | "claude";

export type Brand = {
  id: BrandId;
  name: string;
  logo: string;
  logoWatermark: string;
  accentColor: string;
};

export const defaultBrands: Brand[] = [
  { id: "chatgpt", name: "ChatGPT", logo: "/brands/openai.svg", logoWatermark: "/brands/openai.svg", accentColor: "#111214" },
  { id: "claude", name: "Claude", logo: "/brands/claude.svg", logoWatermark: "/brands/claude.svg", accentColor: "#D97757" },
];
