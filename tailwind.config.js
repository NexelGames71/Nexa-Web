/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        shell: "#f7f7f8",
        line: "#e7e7e8",
        panel: "#ffffff",
        sidebar: "#f7f7f8",
        muted: "#6b6b6f",
        user: "#f4f4f5",
        chat: {
          surface: "#ffffff",
          sidebar: "#f9f9f9",
          border: "#0000001a",
          "border-strong": "#00000026",
          hover: "#0000000d",
          muted: "#8f8f8f",
          user: "#f4f4f4",
        },
      },
      boxShadow: {
        soft: "0 8px 24px rgba(17, 17, 17, 0.04)",
        "chat-composer": "0 0 0 1px rgba(0,0,0,0.10)",
        "chat-popover": "0 0 0 1px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};
