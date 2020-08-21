module.exports = {
    root: true,
    env: {
      node: true,
      "jest/globals": true
    },
    globals: {
      expect: true
    },
    extends: [
      'airbnb-base',
      'prettier',
      "plugin:jest/recommended"
    ],
    plugins: ['prettier', 'jest'],
    parserOptions: {
      sourceType: 'module',
      parser: 'babel-eslint'
    },
    rules: {
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: 4,
          multiline: {
            max: 1,
            allowFirstLine: true
          }
        }
      ]
    }
  }