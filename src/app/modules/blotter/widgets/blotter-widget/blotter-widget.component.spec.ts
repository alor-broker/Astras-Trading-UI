import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { BlotterService } from 'src/app/shared/services/blotter.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { BlotterWidgetComponent } from './blotter-widget.component';

const settings : BlotterSettings = {
  exchange: 'MOEX',
  portfolio: 'D39004'
}

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlotterWidgetComponent ],
      imports: [SharedModule],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter }
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterWidgetComponent);
    component = fixture.componentInstance;
    component.widget = {
      title: WidgetNames.blotter,
      gridItem: { x: 0, y: 0, rows: 1, cols: 1 },
      settings
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
