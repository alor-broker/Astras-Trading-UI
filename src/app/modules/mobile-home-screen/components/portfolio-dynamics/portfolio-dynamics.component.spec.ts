import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioDynamicsComponent } from './portfolio-dynamics.component';

describe('PortfolioDynamicsComponent', () => {
  let component: PortfolioDynamicsComponent;
  let fixture: ComponentFixture<PortfolioDynamicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioDynamicsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioDynamicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
