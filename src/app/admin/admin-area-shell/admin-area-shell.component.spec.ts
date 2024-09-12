import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAreaShellComponent } from './admin-area-shell.component';

describe('AdminAreaShellComponent', () => {
  let component: AdminAreaShellComponent;
  let fixture: ComponentFixture<AdminAreaShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminAreaShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAreaShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
