import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';

import { TerminalSettingsWidgetComponent } from './terminal-settings-widget.component';

describe('TerminalSettingsWidgetComponent', () => {
  let component: TerminalSettingsWidgetComponent;
  let fixture: ComponentFixture<TerminalSettingsWidgetComponent>;
  let modalSpy = jasmine.createSpyObj('ModalService', ['openHelpModal']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TerminalSettingsWidgetComponent],
      providers: [
        { provide: ModalService, useValue: modalSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalSettingsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
