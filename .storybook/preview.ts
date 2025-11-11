import PreviewDecorator from './decorators/Preview';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['README'],
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    PreviewDecorator,
  ],
};

export default preview;
