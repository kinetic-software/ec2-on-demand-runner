import { run } from '../src/main';

jest.mock('../src/main', () => ({
  run: jest.fn()
}));

describe('index', () => {
  it('calls run when imported', async () => {
    require('../src/index');

    expect(run).toHaveBeenCalled();
  });
});
