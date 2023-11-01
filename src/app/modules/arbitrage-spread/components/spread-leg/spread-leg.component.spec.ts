import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpreadLegComponent } from './spread-leg.component';
import { commonTestProviders, getTranslocoModule, sharedModuleImportForTests } from "../../../../shared/utils/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe('SpreadLegComponent', () => {
  let component: SpreadLegComponent;
  let fixture: ComponentFixture<SpreadLegComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SpreadLegComponent],
      imports: [
        BrowserAnimationsModule,
        ...sharedModuleImportForTests,
        getTranslocoModule()
      ],
      providers: [...commonTestProviders]
    });
    fixture = TestBed.createComponent(SpreadLegComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
