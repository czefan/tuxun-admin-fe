import { defineConfig } from '@soybeanjs/eslint-config-vue';

export default [
  ...(await defineConfig({
    'vue/component-name-in-template-casing': [
      'warn',
      'PascalCase',
      {
        registeredComponentsOnly: false,
        ignores: ['/^icon-/']
      }
    ]
  })),
  {
    // msw 生成的 Service Worker 属于 vendor 产物，不参与 lint
    ignores: ['dist/**', 'src/mocks/public/**']
  }
];
