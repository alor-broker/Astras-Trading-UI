import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PortfolioComponent } from './portfolio.component';
import { ClientService } from '../../../../shared/services/client.service';

describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;
  const clientServiceSpy = jasmine.createSpyObj('ClientService', ['get']);
  clientServiceSpy.get.and.returnValue(of({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortfolioComponent],
      providers: [
        PortfolioComponent,
        { provide: ClientService, useValue: clientServiceSpy }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
