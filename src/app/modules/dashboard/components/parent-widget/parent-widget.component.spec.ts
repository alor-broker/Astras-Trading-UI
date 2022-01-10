import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';

import { ParentWidgetComponent } from './parent-widget.component';

describe('ParentWidgetComponent', () => {
  let component: ParentWidgetComponent;
  let fixture: ComponentFixture<ParentWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParentWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentWidgetComponent);
    component = fixture.componentInstance;
    component.widget = {
      title: WidgetNames.blotter,
      gridItem: { x: 0, y: 0, rows: 1, cols: 1 },
      settings: {
        exchange: 'MOEX',
        portfolio: 'D39004'
      }
    }
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
