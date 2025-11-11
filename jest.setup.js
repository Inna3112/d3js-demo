import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();
jest.mock('next/navigation', () => ({
  useParams: () => ({ lng: 'en' }),
}));

