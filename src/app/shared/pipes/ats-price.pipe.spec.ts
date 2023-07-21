import { AtsPricePipe } from './ats-price.pipe';

describe('AtsPricePipe', () => {
  it('create an instance', () => {
    const pipe = new AtsPricePipe('ru');
    expect(pipe).toBeTruthy();
  });
});
