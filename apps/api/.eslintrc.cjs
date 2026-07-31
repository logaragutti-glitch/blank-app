module.exports = {
  root: true,
  parserOptions: {
    project: "./tsconfig.json",
  },
  extends: [require.resolve("@eve-os/config/eslint-preset.cjs")],
};
