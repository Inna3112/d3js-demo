import type { StorybookConfig } from '@storybook/nextjs';

const storybookConfig: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-addon-mock',
    '@storybook/addon-mdx-gfm',
  ],
  framework: '@storybook/nextjs',
  core: {
    disableTelemetry: true,
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  staticDirs: ['../public'],
};

export default storybookConfig;
