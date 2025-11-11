import { I18nextProvider } from 'react-i18next';

import { i18next } from '../../src/i18n/client';

import type { ComponentType, ReactElement } from 'react';

function Preview(Story: ComponentType): ReactElement {
  return (
    <I18nextProvider i18n={i18next}>
      <Story />
    </I18nextProvider>
  );
}

export default Preview;
