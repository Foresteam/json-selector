import antfu from '@antfu/eslint-config';

export default antfu(
  {
    ignores: ['node_modules/', '**/*.d.ts', '**/*.json', '!./*.json', '**/.*', '.*/', '**/migration_lock.toml'],
    formatters: true,
    stylistic: true,
    vue: true
  },
  {
    ignores: ['node_modules/'],
    files: ['**/*.vue'],
    rules: {
      'vue/no-irregular-whitespace': ['off'],
      'vue/no-arrow-functions-in-watch': 'off',
      'vue/comma-dangle': ['error', 'never'],
      'vue/object-curly-spacing': ['error', 'always', { objectsInObjects: true, arraysInObjects: true }],
      'vue/comma-spacing': ['error', { before: false, after: true }],
      'vue/brace-style': ['error', 'stroustrup'],
      'vue/define-macros-order': 'off',
      'vue/dot-location': 'off',
      'vue/object-curly-newline': 'off',
      'vue/space-unary-ops': 'off',
      'vue/custom-event-name-casing': 'off'
    }
  },
  {
    rules: {
      'regexp/no-obscure-range': 'off',
      'jsonc/comma-dangle': ['error', 'never'],
      'style/comma-dangle': ['error', 'never'],
      'style/indent': ['error', 2, { SwitchCase: 1 }],
      'jsonc/indent': ['error', 2, { SwitchCase: 1 }],
      'style/semi': ['error', 'always'],
      'style/arrow-parens': 'off',
      'style/quotes': ['error', 'single', { avoidEscape: false }],
      'style/linebreak-style': ['error', 'unix'],
      'dot-notation': 'error',
      'style/object-curly-spacing': ['error', 'always', { objectsInObjects: true, arraysInObjects: true }],
      'jsonc/object-curly-spacing': ['error', 'always', { objectsInObjects: true, arraysInObjects: true }],
      'style/comma-spacing': ['error', { before: false, after: true }],
      'style/brace-style': ['error', 'stroustrup'],
      'style/nonblock-statement-body-position': ['error', 'below'],
      'eslint-comments/no-unlimited-disable': 'off',
      'no-irregular-whitespace': ['off'],
      'style/no-mixed-operators': 'off',
      'no-cond-assign': 'off',
      'unused-imports/no-unused-imports': ['warn', 'all'],

      'no-alert': 'warn',
      'prefer-arrow-callback': 'off',

      'antfu/top-level-function': 'off',
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],

      'style/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false
          },
          multilineDetection: 'brackets'
        }
      ]
    }
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts'],
    rules: {
      'antfu/no-top-level-await': 'off'
    }
  }
);
