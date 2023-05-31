import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ParentWidgetComponent} from './parent-widget.component';
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

describe('ParentWidgetComponent', () => {
  let component: ParentWidgetComponent;
  let fixture: ComponentFixture<ParentWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ParentWidgetComponent
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentWidgetComponent);
    component = fixture.componentInstance;
    component.widget = {
      instance: {
        guid: '123',
        position: {x: 0, y: 0, rows: 1, cols: 1},
        widgetType: 'test-widget'
      },
      widgetMeta: {

      } as WidgetMeta
    };
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
