/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(0 0% 20%)",
        input: "hsl(0 0% 14%)",
        ring: "hsl(212 100% 50%)",
        background: "hsl(0 0% 4%)",
        foreground: "hsl(0 0% 96%)",
        primary: {
          DEFAULT: "hsl(38 92% 55%)",
          foreground: "hsl(0 0% 8%)",
        },
        muted: {
          DEFAULT: "hsl(0 0% 12%)",
          foreground: "hsl(0 0% 70%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 9%)",
          foreground: "hsl(0 0% 96%)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
      },
    },
  },
  plugins: [],
};
