import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-100': '#111111',
        'dark-200': '#222222',
        'dark-300': '#333333',
        'dark-400': '#333333'
      },
    },
  },
  plugins: [],
} satisfies Config;
