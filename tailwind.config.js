/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      // {
      //   mytheme: {
      //     primary: "#9ca3af",
      //     secondary: "#1e3a8a",
      //     accent: "#5b9abf",
      //     neutral: "#191C2E",
      //     "base-100": "#f3f4f6",
      //     info: "#8CB8E3",
      //     success: "#3EE087",
      //     warning: "#CB8310",
      //     error: "#f43f5e",
      //     "--rounded-box": "1rem", // border radius rounded-box utility class, used in card and other large boxes
      //     "--rounded-btn": "0.5rem", // border radius rounded-btn utility class, used in buttons and similar element
      //     "--rounded-badge": "1.9rem", // border radius rounded-badge utility class, used in badges and similar
      //     "--animation-btn": "0.25s", // duration of animation when you click on button
      //     "--animation-input": "0.2s", // duration of animation for inputs like checkbox, toggle, radio, etc
      //     "--btn-text-case": "uppercase", // set default text transform for buttons
      //     "--btn-focus-scale": "0.95", // scale transform of button when you focus on it
      //     "--border-btn": "1px", // border width of buttons
      //     "--tab-border": "1px", // border width of tabs
      //     "--tab-radius": "0.5rem", // border radius of tabs
      //   },
      // },
    ],
  },
};
