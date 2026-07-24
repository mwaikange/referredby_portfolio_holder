import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#193f4a",
        ember: "#d7282f",
        field: "#f7f8f5",
        reed: "#63746d",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(25, 63, 74, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
