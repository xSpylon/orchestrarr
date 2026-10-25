/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-recommended-scss'],
  rules: {
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
  },
};
