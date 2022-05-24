import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpWidgetComponent } from './help-widget.component';
import { ModalService } from 'src/app/shared/services/modal.service';
import { of } from 'rxjs';

describe('HelpWidgetComponent', () => {
  let component: HelpWidgetComponent;
  let fixture: ComponentFixture<HelpWidgetComponent>;
  let modalSpy = jasmine.createSpyObj('ModalService', ['helpParams$']);
  modalSpy.helpParams$ = of();

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [HelpWidgetComponent],
      providers: [
        { provide: ModalService, useValue: modalSpy }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
