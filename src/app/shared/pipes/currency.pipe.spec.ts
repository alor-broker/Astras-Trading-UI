import { CurrencyPipe } from './currency.pipe';

describe('CurrencyPipe', () => {
  it('create an instance', () => {
    const pipe = new CurrencyPipe();
    expect(pipe).toBeTruthy();
  });
});
