/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff1f1",
          100: "#ffe4e4",
          200: "#ffb3b3",
          400: "#ff4444",
          500: "#e50000",
          600: "#cc0000",
          700: "#990000",
          900: "#550000",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "cursive"],
        body: ["'DM Sans'", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        kenburns: "kenburns 14s ease-out forwards",
        pop: "pop 0.35s ease",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        kenburns: { "0%": { transform: "scale(1)" }, "100%": { transform: "scale(1.08)" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.45)" }, "100%": { transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-700px 0" }, "100%": { backgroundPosition: "700px 0" } },
      },
    },
  },
  plugins: [],
}
