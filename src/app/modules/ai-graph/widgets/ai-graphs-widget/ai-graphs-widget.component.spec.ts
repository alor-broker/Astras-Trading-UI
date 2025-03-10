import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiGraphsWidgetComponent } from './ai-graphs-widget.component';
import {MockProvider} from "ng-mocks";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {EMPTY} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

describe('AiGraphsWidgetComponent', () => {
  let component: AiGraphsWidgetComponent;
  let fixture: ComponentFixture<AiGraphsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AiGraphsWidgetComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY,
            getSettingsOrNull: () => EMPTY,
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiGraphsWidgetComponent);
    component = fixture.componentInstance;
    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {widgetName: {}} as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
