import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminClientsComponent } from './admin-clients.component';
import { MockComponents } from "ng-mocks";
import { SelectClientPortfolioBtnComponent } from "../../../../admin/components/select-client-portfolio-btn/select-client-portfolio-btn.component";

describe('AdminClientsComponent', () => {
  let component: AdminClientsComponent;
  let fixture: ComponentFixture<AdminClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminClientsComponent,
        MockComponents(
          SelectClientPortfolioBtnComponent
        )
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
