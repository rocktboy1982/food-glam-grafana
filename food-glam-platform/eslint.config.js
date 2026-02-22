module.exports = {
  root: true,
  plugins: ['@typescript-eslint/eslint-plugin', 'eslint-plugin-react', 'eslint-config-next'],
  extends: ['eslint-config-next', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:prettier/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'args': 'none' }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-console': 'warn',
    'no-debugger': 'error',
  },
};