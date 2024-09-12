import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAreaShellComponent } from './client-area-shell.component';

describe('ClientAreaShellComponent', () => {
  let component: ClientAreaShellComponent;
  let fixture: ComponentFixture<ClientAreaShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientAreaShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientAreaShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
