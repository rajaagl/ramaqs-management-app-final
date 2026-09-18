//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      // API responses remain partially dynamic; keep these checks visible without
      // blocking delivery while the response types are progressively tightened.
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      // Ancienne bibliothèque UI non importée dans la livraison courante.
      'src/components/ui/**',
      'src/components/ui-bits.tsx',
      'src/routes/app.ressources.tsx',
    ],
  },
]
