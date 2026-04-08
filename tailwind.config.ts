import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#492A34", hover: "#5A3542" },
        secondary: "#B99D86",
        background: "#fdfcfa",
        foreground: "#221B16",
        card: "#FFFFFF",
        border: "#E8DCCB",
        input: "#FDFBF7",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#8A1225",
      },
      fontFamily: { sans: ["Carlito", "sans-serif"] },
      borderRadius: { DEFAULT: "12px" },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(34 27 22 / 0.05)",
        DEFAULT: "0 4px 6px -1px rgb(34 27 22 / 0.08), 0 2px 4px -2px rgb(34 27 22 / 0.08)",
        lg: "0 10px 15px -3px rgb(34 27 22 / 0.1), 0 4px 6px -4px rgb(34 27 22 / 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
