import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentWidgetComponent } from './parent-widget.component';

describe('ParentWidgetComponent', () => {
  let component: ParentWidgetComponent;
  let fixture: ComponentFixture<ParentWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
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
      hasSettings: false,
      hasHelp: false,
      guid: '123',
      gridItem: { x: 0, y: 0, rows: 1, cols: 1 },
    };
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
