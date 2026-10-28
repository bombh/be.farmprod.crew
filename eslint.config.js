// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // React Compiler rules (eslint-plugin-react-hooks v7, SDK 58): the compiler is not enabled, and they flag
    // Reanimated shared values written with `.value =` and the "latest value in a ref" pattern
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);
