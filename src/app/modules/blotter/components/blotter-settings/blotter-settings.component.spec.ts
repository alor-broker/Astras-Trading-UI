import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from 'src/app/shared/shared.module';
import { BlotterService } from '../../services/blotter.service';

import { BlotterSettingsComponent } from './blotter-settings.component';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';
import { AppModule } from 'src/app/app.module';

describe('BlotterSettingsComponent', () => {
  let component: BlotterSettingsComponent;
  let fixture: ComponentFixture<BlotterSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlotterSettingsComponent ],
      imports: [ SharedModule, AppModule, ],
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
