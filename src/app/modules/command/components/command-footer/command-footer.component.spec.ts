import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';

import { CommandFooterComponent } from './command-footer.component';

describe('CommandFooterComponent', () => {
  let component: CommandFooterComponent;
  let fixture: ComponentFixture<CommandFooterComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const commandSpy = jasmine.createSpyObj('CommandsService', ['submitMarket', 'submitLimit']);
    const modalSpy = jasmine.createSpyObj('ModalService', ['closeCommandModal']);
    await TestBed.configureTestingModule({
      declarations: [ CommandFooterComponent ],
      providers: [
        { provide: CommandsService, useValue: commandSpy },
        { provide: ModalService, useValue: modalSpy },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
