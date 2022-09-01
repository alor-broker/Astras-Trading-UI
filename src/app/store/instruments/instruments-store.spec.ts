import { TestBed } from "@angular/core/testing";
import { Store } from "@ngrx/store";
import { sharedModuleImportForTests } from "../../shared/utils/testing";
import {
  of,
  take
} from "rxjs";
import { defaultInstrument } from "./instruments.reducer";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import { InstrumentsService } from "../../modules/instruments/services/instruments.service";
import { Instrument, InstrumentBadges } from "../../shared/models/instruments/instrument.model";
import { getSelectedInstrumentByBadge, getSelectedInstrumentsWithBadges } from "./instruments.selectors";
import { instrumentsBadges } from "../../shared/utils/instruments";
import { selectNewInstrumentByBadge } from "./instruments.actions";

describe('Instruments Store', () => {
  let store: Store;
  let instrumentsServiceSpy: any;

  const expectedInstrumentKey: InstrumentKey = {
    symbol: 'VTBR',
    exchange: 'MOEX'
  };

  const expectedInstrumentDetails: Instrument = {
    ...expectedInstrumentKey,
    shortName: 'shortName',
    description: 'description',
    instrumentGroup: 'instrumentGroup',
    isin: 'isin',
    currency: 'RUB',
    minstep: 1,
    lotsize: 100,
    cfiCode: 'cfiCode'
  };

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);

    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: InstrumentsService, useValue: instrumentsServiceSpy }
      ]
    });

    store = TestBed.inject(Store);
  });

  it('default instruments with badges should be selected', (done) => {
    store.select(getSelectedInstrumentsWithBadges).pipe(
      take(1)
    ).subscribe(instrument => {
      const expectedState = instrumentsBadges.reduce((acc, curr) => {
        acc[curr] = defaultInstrument;
        return acc;
      }, {} as InstrumentBadges);
      done();
      expect(instrument).toEqual(expectedState);
    });
  });

  it('selectNewInstrumentByBadge should request instrument details', (done) => {
      instrumentsServiceSpy.getInstrument.and.returnValue(of(expectedInstrumentDetails));

      store.dispatch(selectNewInstrumentByBadge({ badgeColor: 'yellow', instrument: expectedInstrumentKey }));

      expect(instrumentsServiceSpy.getInstrument).toHaveBeenCalledOnceWith(expectedInstrumentKey);

      store.select(getSelectedInstrumentByBadge('yellow')).pipe(
        take(1)
      ).subscribe(instrument => {
        done();
        expect(instrument).toEqual(expectedInstrumentDetails);
      });
    }
  );
});
