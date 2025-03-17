import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioPropertyEditorComponent } from './portfolio-property-editor.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";
import {MockProvider} from "ng-mocks";
import { UserPortfoliosService } from 'src/app/shared/services/user-portfolios.service';
import { EMPTY } from 'rxjs';

describe('PortfolioPropertyEditorComponent', () => {
  let component: PortfolioPropertyEditorComponent;
  let fixture: ComponentFixture<PortfolioPropertyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PortfolioPropertyEditorComponent,
        TranslocoTestsModule.getModule()
      ],
      providers:[
        MockProvider(
          UserPortfoliosService,
          {
            getPortfolios: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioPropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
