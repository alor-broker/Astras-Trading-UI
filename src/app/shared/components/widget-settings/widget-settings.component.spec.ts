import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetSettingsComponent } from './widget-settings.component';
import { getTranslocoModule } from "../../utils/testing";

describe('WidgetSettingsComponent', () => {
  let component: WidgetSettingsComponent;
  let fixture: ComponentFixture<WidgetSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [WidgetSettingsComponent]
    });
    fixture = TestBed.createComponent(WidgetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
