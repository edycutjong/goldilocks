import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['coverage/**', 'dist/**', 'docs/**']
  },
  ...tseslint.configs.recommended,
);
