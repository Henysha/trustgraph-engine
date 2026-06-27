/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        trust: "#2563eb",
        risk: "#dc2626",
      },
    },
  },
  plugins: [],
};
