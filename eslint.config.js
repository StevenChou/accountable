import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['frontend/dist/', 'frontend/coverage/']),
  {
    files: ['frontend/**/*.{js,mjs,ts,tsx}'],
    extends: [js.configs.recommended],
    rules: { complexity: ['error', 15] },
  },
  {
    files: ['frontend/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['frontend/{src,test}/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['frontend/*.config.{js,mjs,ts}'],
    languageOptions: { globals: globals.node },
  },
])
