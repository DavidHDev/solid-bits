import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import solid from 'eslint-plugin-solid/configs/v2';
import { globalIgnores } from 'eslint/config';
import type { Linter } from 'eslint';

export default tseslint.config(
  globalIgnores(['**/dist/**', '**/node_modules/**', 'public/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'app/solid',
    files: ['src/**/*.{ts,tsx}'],
    ...(solid as unknown as Linter.Config)
  },
  {
    name: 'app/ts-rules',
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'solid/no-innerhtml': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }
      ]
    }
  }
);
