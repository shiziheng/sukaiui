export type BrandId = "chatgpt" | "claude";

export type Brand = {
  id: BrandId;
  name: string;
};

export const defaultBrands: Brand[] = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
];
