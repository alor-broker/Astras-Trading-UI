import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';

import { CommandWidgetComponent } from './command-widget.component';

describe('CommandWidgetComponent', () => {
  let component: CommandWidgetComponent;
  let fixture: ComponentFixture<CommandWidgetComponent>;

  const modalSpy = jasmine.createSpyObj('ModalService', ['commandParams$']);
  modalSpy.commandParams$ = of();

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommandWidgetComponent],
      providers: [
        { provide: ModalService, useValue: modalSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
