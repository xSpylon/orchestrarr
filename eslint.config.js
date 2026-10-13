import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public'] },
  {
    // The React app: TypeScript, the official hooks rules and accessibility checks.
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      // The data hooks reset their loading state in the effect that starts a fetch, so a new title or
      // query never shows the previous result. That is the documented exception to this rule, and we
      // don't run the React Compiler that the rule is written for. Derivable state is still fixed by hand.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // The Node API server, dev scripts, tests and build config.
    files: ['server.js', 'server/**/*.js', 'scripts/**/*.mjs', 'tests/**/*.mjs', 'vite.config.ts'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
);
