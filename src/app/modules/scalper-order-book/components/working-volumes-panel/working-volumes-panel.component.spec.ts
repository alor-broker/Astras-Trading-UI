import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingVolumesPanelComponent } from './working-volumes-panel.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Subject } from 'rxjs';
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { SCALPER_ORDERBOOK_SHARED_CONTEXT } from "../scalper-order-book/scalper-order-book.component";
import { LetDirective } from "@ngrx/component";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";

describe('WorkingVolumesPanelComponent', () => {
  let component: WorkingVolumesPanelComponent;
  let fixture: ComponentFixture<WorkingVolumesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[LetDirective],
      declarations: [WorkingVolumesPanelComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ScalperHotKeyCommandService,
          useValue: {
            commands$: new Subject()
          }
        },
        {
          provide: WidgetLocalStateService,
          useValue: {
            getStateRecord: jasmine.createSpy('getStateRecord').and.returnValue(new Subject()),
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        },
        {
          provide: SCALPER_ORDERBOOK_SHARED_CONTEXT,
          useValue: {
            setWorkingVolume: jasmine.createSpy('setWorkingVolume').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingVolumesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
