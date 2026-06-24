module.exports = {
  extends: require.resolve('@umijs/max/stylelint'),
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'theme',
          'layer',
          'apply',
          'variants',
          'responsive',
          'screen',
          'source',
          'utility',
          'custom-variant',
        ],
      },
    ],
    // Tailwind @theme tokens and design-system rgba() notation differ from stylelint defaults.
    'alpha-value-notation': null,
    'color-hex-length': null,
    'custom-property-empty-line-before': null,
    'value-keyword-case': [
      'lower',
      {
        ignoreKeywords: ['Inter', 'BlinkMacSystemFont'],
      },
    ],
  },
};
