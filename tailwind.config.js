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
          sidebar: "#f7f7f8",
          border: "#e5e5e5",
          "border-strong": "#d9d9d9",
          hover: "#ececec",
          muted: "#8e8e8e",
          user: "#f4f4f4",
        },
      },
      boxShadow: {
        soft: "0 8px 24px rgba(17, 17, 17, 0.04)",
        "chat-composer":
          "0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)",
        "chat-popover": "0 8px 28px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
