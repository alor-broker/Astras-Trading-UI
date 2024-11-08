import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ExternalLinkComponent} from './external-link.component';
import {MockDirective} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('ExternalLinkComponent', () => {
  let component: ExternalLinkComponent;
  let fixture: ComponentFixture<ExternalLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ExternalLinkComponent,
        MockDirective(NzIconDirective)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ExternalLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
