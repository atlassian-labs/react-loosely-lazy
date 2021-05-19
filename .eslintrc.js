module.exports = {
  parser: 'babel-eslint',
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  globals: {
    // Enable webpack require
    require: 'readonly',
    // Fix for eslint-plugin-flowtype/384 not supporting wildcard
    _: 'readonly',
  },
  plugins: ['react', 'react-hooks', 'import'],
  rules: {
    'no-shadow': ['error'],
    indent: ['off'],
    'linebreak-style': ['off'],
    quotes: ['off'],
    semi: ['off'],
    'newline-before-return': ['error'],
    'prettier/prettier': ['warn'],
    'react/no-direct-mutation-state': ['off'],
    'react/display-name': ['off'],
    'react-hooks/rules-of-hooks': ['error'],
    'react-hooks/exhaustive-deps': ['warn'],
  },
  overrides: [
    {
      // Enable a node environment for dot, config, and setup files, and any
      // file under the webpack, babel, and test folders
      files: [
        '.*.js',
        '*.config.js',
        '*.setup.js',
        'src/webpack/**/*',
        'src/babel/**/*',
        'src/__tests__/**/*',
      ],
      env: {
        node: true,
      },
    },
    {
      // Enable a jest environment for test files
      files: ['*.test.{js,ts,tsx}'],
      env: {
        jest: true,
      },
    },
    {
      // Flow specific rules
      files: ['*.js.flow', '*/*flow.js', '*.flow.test.js'],
      extends: ['plugin:flowtype/recommended'],
      plugins: ['flowtype'],
      rules: {
        'flowtype/generic-spacing': ['off'],
        'no-unused-vars': ['off'],
      },
    },
    {
      // TypeScript specific rules
      files: ['*.{ts,tsx}'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': 'allow-with-description',
          },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
      },
    },
    {
      // TypeScript specific rules for type tests
      files: ['*.typescript.test.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
