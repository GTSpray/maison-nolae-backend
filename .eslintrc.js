module.exports = {
    root: true,
    env: {
      node: true,
      'jest/globals': true
    },
    globals: {
      expect: true
    },
    extends: [
      'airbnb-base',
      'prettier',
      'plugin:jest/recommended'
    ],
    plugins: ['prettier', 'jest'],
    parserOptions: {
      sourceType: 'module',
      parser: 'babel-eslint'
    },
    rules: {
      'vue/max-attributes-per-line': 'off',
      'jest/no-test-callback': 'off',
      'quotes': [2, 'single', 'avoid-escape']
    }
  }