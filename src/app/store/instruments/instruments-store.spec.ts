import { TestBed } from "@angular/core/testing";
import { Store } from "@ngrx/store";
import { sharedModuleImportForTests } from "../../shared/utils/testing";
import { getSelectedInstrument } from "./instruments.selectors";
import {
  of,
  take
} from "rxjs";
import { defaultInstrument } from "./instruments.reducer";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { selectNewInstrument } from "./instruments.actions";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import { InstrumentsService } from "../../modules/instruments/services/instruments.service";
import { Instrument } from "../../shared/models/instruments/instrument.model";

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

  it('default instrument should be selected', (done) => {
    store.select(getSelectedInstrument).pipe(
      take(1)
    ).subscribe(instrument => {
      done();
      expect(instrument).toEqual(defaultInstrument);
    });
  });

  it('selectNewInstrument should request instrument details', (done) => {
      instrumentsServiceSpy.getInstrument.and.returnValue(of(expectedInstrumentDetails));

      store.dispatch(selectNewInstrument({ instrument: expectedInstrumentKey }));

      expect(instrumentsServiceSpy.getInstrument).toHaveBeenCalledOnceWith(expectedInstrumentKey);

      store.select(getSelectedInstrument).pipe(
        take(1)
      ).subscribe(instrument => {
        done();
        expect(instrument).toEqual(expectedInstrumentDetails);
      });
    }
  );
});
