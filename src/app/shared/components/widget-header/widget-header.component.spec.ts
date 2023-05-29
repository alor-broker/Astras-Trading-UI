import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { WidgetHeaderComponent } from './widget-header.component';
import { WidgetSettingsService } from '../../services/widget-settings.service';
import { ManageDashboardsService } from '../../services/manage-dashboards.service';
import { ModalService } from '../../services/modal.service';
import { ngZorroMockComponents } from '../../utils/testing';
import {TranslatorService} from "../../services/translator.service";


describe('WidgetHeaderComponent', () => {
  let component: WidgetHeaderComponent;
  let fixture: ComponentFixture<WidgetHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WidgetHeaderComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough(),
            updateIsLinked: jasmine.createSpy('updateIsLinked').and.callThrough(),
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            removeWidget: jasmine.createSpy('removeWidget').and.callThrough()
          }
        },
        {
          provide: ModalService,
          useValue: {
            openHelpModal: jasmine.createSpy('openHelpModal').and.callThrough()
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getActiveLang: jasmine.createSpy('getActiveLang').and.returnValue('ru')
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WidgetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
