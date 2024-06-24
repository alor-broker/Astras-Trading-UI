import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgesSettingsComponent } from './badges-settings.component';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe('BadgesSettingsComponent', () => {
  let component: BadgesSettingsComponent;
  let fixture: ComponentFixture<BadgesSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgesSettingsComponent],
      imports: [
        BrowserAnimationsModule,
        getTranslocoModule(),
        ...sharedModuleImportForTests
      ],
      providers: [
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
