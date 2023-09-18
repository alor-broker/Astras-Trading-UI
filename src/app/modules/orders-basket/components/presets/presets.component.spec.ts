import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetsComponent } from './presets.component';
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";

describe('PresetsComponent', () => {
  let component: PresetsComponent;
  let fixture: ComponentFixture<PresetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        PresetsComponent,
        ...ngZorroMockComponents
      ]
    });
    fixture = TestBed.createComponent(PresetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
