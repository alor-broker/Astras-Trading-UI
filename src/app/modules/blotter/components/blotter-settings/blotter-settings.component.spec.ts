import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { BlotterSettingsComponent } from './blotter-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe('BlotterSettingsComponent', () => {
  let component: BlotterSettingsComponent;
  let fixture: ComponentFixture<BlotterSettingsComponent>;
  const settingsMock = {
    exchange: 'MOEX',
    portfolio: 'D39004',
    guid: '1230',
    ordersColumns: ['ticker'],
    tradesColumns: ['ticker'],
    positionsColumns: ['ticker'],
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        BlotterSettingsComponent,
        ...ngZorroMockComponents,
      ],
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        NzSelectModule,
        NzSwitchModule,
        getTranslocoModule()
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
