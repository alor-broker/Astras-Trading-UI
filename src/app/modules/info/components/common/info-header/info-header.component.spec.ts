import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InfoHeaderComponent} from './info-header.component';
import {InstrumentType} from "../../../../../shared/models/enums/instrument-type.model";
import {MockComponents} from "ng-mocks";
import {InstrumentIconComponent} from "../../../../../shared/components/instrument-icon/instrument-icon.component";

describe('InfoHeaderComponent', () => {
  let component: InfoHeaderComponent;
  let fixture: ComponentFixture<InfoHeaderComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InfoHeaderComponent,
        ...MockComponents(InstrumentIconComponent)
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoHeaderComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'info',
      {
        symbol: '',
        shortName: '',
        exchange: '',
        board: "",
        typeByCfi: InstrumentType.Stock,
        description: '',
        isin: '',
        currency: '',
        type: '',
        lotsize: 1,
        minstep: 1,
        pricestep: 1
      }
    );

    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
