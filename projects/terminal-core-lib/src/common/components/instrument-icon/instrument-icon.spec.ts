import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {InstrumentIcon} from './instrument-icon';
import {ICONS_STORAGE_URL_PROVIDER} from '../../../config/api-url-providers';

describe('InstrumentIcon', () => {
  const iconsStorageUrl = 'https://icons.test/storage';

  function createComponent(): ComponentFixture<InstrumentIcon> {
    TestBed.configureTestingModule({
      providers: [
        {provide: ICONS_STORAGE_URL_PROVIDER, useValue: {iconsStorageUrl}}
      ]
    });

    return TestBed.createComponent(InstrumentIcon);
  }

  describe('iconUrl', () => {
    it('should build the icon url from the storage provider and the symbol', () => {
      const fixture = createComponent();
      fixture.componentRef.setInput('symbol', 'SBER');

      expect(fixture.componentInstance.iconUrl()).toBe(`${iconsStorageUrl}/SBER.png`);
    });

    it('should recompute when the symbol changes', () => {
      const fixture = createComponent();
      fixture.componentRef.setInput('symbol', 'SBER');
      expect(fixture.componentInstance.iconUrl()).toBe(`${iconsStorageUrl}/SBER.png`);

      fixture.componentRef.setInput('symbol', 'GAZP');
      expect(fixture.componentInstance.iconUrl()).toBe(`${iconsStorageUrl}/GAZP.png`);
    });
  });
});
