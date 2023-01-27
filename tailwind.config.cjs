// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
    },
    screens: {
      sm: "560px",
      // => @media (min-width: 640px) { ... }

      md: "768px",
      // => @media (min-width: 768px) { ... }

      lg: "1024px",
      // => @media (min-width: 1024px) { ... }

      xl: "1280px",
      // => @media (min-width: 1280px) { ... }

      "2xl": "1536px",
      // => @media (min-width: 1536px) { ... }
    },
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      scale: {
        102: "1.02",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateY(-200px)" },
          "50%": { transform: "translateY(0)" },
        },
      },
      animation: {
        slideIn: "slideIn 0.5s ease-in-out",
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant(
        "invalid-unfocused",
        "&:invalid:not(:placeholder-shown):not(:focus)"
      );
    }),
  ],
};
