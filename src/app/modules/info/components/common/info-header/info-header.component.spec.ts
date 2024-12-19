import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InfoHeaderComponent } from './info-header.component';
import { EnvironmentService } from "../../../../../shared/services/environment.service";
import { InstrumentType } from "../../../../../shared/models/enums/instrument-type.model";

describe('InfoHeaderComponent', () => {
  let component: InfoHeaderComponent;
  let fixture: ComponentFixture<InfoHeaderComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InfoHeaderComponent
      ],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            alorIconsStorageUrl: ''
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoHeaderComponent);
    component = fixture.componentInstance;
    component.info = {
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
    };

    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
