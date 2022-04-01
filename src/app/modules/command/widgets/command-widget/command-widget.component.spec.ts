import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';

import { CommandWidgetComponent } from './command-widget.component';

describe('CommandWidgetComponent', () => {
  let component: CommandWidgetComponent;
  let fixture: ComponentFixture<CommandWidgetComponent>;

  const modalSpy = jasmine.createSpyObj('ModalService', ['commandParams$']);
  const commandSpy = jasmine.createSpyObj('CommandsService', ['submitLimitCommand']);
  modalSpy.commandParams$ = of();
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [ CommandWidgetComponent ],
      providers: [
        { provide: ModalService, useValue: modalSpy },
        { provide: CommandsService, useValue: commandSpy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
