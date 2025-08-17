module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "single"],
    "indent": ["error", 2],
    "max-len": ["error", {"code": 120}],
    "require-jsdoc": "off",
    "comma-dangle": ["error", "always-multiline"],
    "object-curly-spacing": ["error", "always"],
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};
