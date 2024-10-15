import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { of } from 'rxjs';
import { InfoService } from '../../../services/info.service';

import { FinanceComponent } from './finance.component';
import { ComponentHelpers } from "../../../../../shared/utils/testing/component-helpers";

describe('FinanceComponent', () => {
  let component: FinanceComponent;
  let fixture: ComponentFixture<FinanceComponent>;

  const infoSpy = jasmine.createSpyObj('InfoService', ['getFinance', 'getExchangeInfo']);
  infoSpy.getFinance.and.returnValue(of(null));
  infoSpy.getExchangeInfo.and.returnValue(of({}));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        FinanceComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-loading-indicator',
          inputs: ['isLoading']
        })
      ],
      providers: [
        { provide: InfoService, useValue: infoSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
