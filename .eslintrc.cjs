/** Root ESLint config; apps/packages extend @eve-os/config/eslint */
module.exports = {
  root: true,
  extends: ["eslint:recommended"],
  ignorePatterns: [
    "**/dist/**",
    "**/.next/**",
    "**/node_modules/**",
    "**/coverage/**",
  ],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
};
