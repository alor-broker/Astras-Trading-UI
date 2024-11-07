import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AstrasLogoComponent} from './astras-logo.component';
import {RouterModule} from "@angular/router";
import {MockDirective} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('AstrasLogoComponent', () => {
  let component: AstrasLogoComponent;
  let fixture: ComponentFixture<AstrasLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AstrasLogoComponent,
        RouterModule.forRoot([]),
        MockDirective(NzIconDirective)
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(AstrasLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
