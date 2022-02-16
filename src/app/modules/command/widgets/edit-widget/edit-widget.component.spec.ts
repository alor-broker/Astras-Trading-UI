import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';

import { EditWidgetComponent } from './edit-widget.component';

describe('EditWidgetComponent', () => {
  let component: EditWidgetComponent;
  let fixture: ComponentFixture<EditWidgetComponent>;

  beforeEach(async () => {
    const modalSpy = jasmine.createSpyObj('ModalService', ['editParams$']);
    const commandSpy = jasmine.createSpyObj('CommandsService', ['submitLimitEdit']);
    modalSpy.editParams$ = of();
    await TestBed.configureTestingModule({
      declarations: [ EditWidgetComponent ],
      providers: [
        { provide: ModalService, useValue: modalSpy },
        { provide: CommandsService, useValue: commandSpy },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
