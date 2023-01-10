import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetMenuComponent } from './widget-menu.component';
import { getTranslocoModule } from "../../utils/testing";

describe('WidgetMenuComponent', () => {
  let component: WidgetMenuComponent;
  let fixture: ComponentFixture<WidgetMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WidgetMenuComponent ],
      imports: [getTranslocoModule()]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
