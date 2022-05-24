import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';

import { BlotterSettingsComponent } from './blotter-settings.component';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';
import { AppModule } from 'src/app/app.module';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('BlotterSettingsComponent', () => {
  let component: BlotterSettingsComponent;
  let fixture: ComponentFixture<BlotterSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlotterSettingsComponent],
      imports: [...sharedModuleImportForTests, AppModule],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
