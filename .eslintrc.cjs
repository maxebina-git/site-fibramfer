module.exports = {
  root: true,
  extends: [
    'astro/eslint-config',
    'prettier'
  ],
  plugins: [
    'astro'
  ],
  overrides: [
    {
      files: ['*.astro'],
      extends: [
        'plugin:astro/recommended'
      ]
    }
  ]
};