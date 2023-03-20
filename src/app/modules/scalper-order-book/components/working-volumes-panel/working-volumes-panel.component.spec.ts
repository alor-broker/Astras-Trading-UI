import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingVolumesPanelComponent } from './working-volumes-panel.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Subject } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';

describe('WorkingVolumesPanelComponent', () => {
  let component: WorkingVolumesPanelComponent;
  let fixture: ComponentFixture<WorkingVolumesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkingVolumesPanelComponent ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: HotKeyCommandService,
          useValue: {
            commands$: new Subject()
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
