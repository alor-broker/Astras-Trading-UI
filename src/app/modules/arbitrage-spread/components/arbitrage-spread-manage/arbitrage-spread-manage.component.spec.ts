import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageSpreadManageComponent } from './arbitrage-spread-manage.component';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {Subject} from "rxjs";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SpreadLegComponent } from "../spread-leg/spread-leg.component";

describe('ArbitrageSpreadManageComponent', () => {
  let component: ArbitrageSpreadManageComponent;
  let fixture: ComponentFixture<ArbitrageSpreadManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ArbitrageSpreadManageComponent,
        SpreadLegComponent
      ],
      imports: [
        BrowserAnimationsModule,
        ...sharedModuleImportForTests, getTranslocoModule()
      ],
      providers: [
        {
          provide: UserPortfoliosService,
          useValue: {
            getPortfolios: jasmine.createSpy('getPortfolios').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrageSpreadManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
