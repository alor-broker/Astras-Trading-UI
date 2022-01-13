import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '../shared/interceptors/auth.interceptor';
import { HandleErrorService } from '../shared/services/handle-error.service';
import { HandleErrorsInterceptor } from '../shared/interceptors/handle-errors.interceptor';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GridsterModule } from 'angular-gridster2';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown'
import { NzModalModule } from 'ng-zorro-antd/modal';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PriceTickComponent } from './components/price-tick/price-tick.component';

@NgModule({
  declarations: [  
    PriceTickComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    GridsterModule,
    // Ng zorro
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzFormModule,
    NzSelectModule,
    NzCollapseModule,
    NzAutocompleteModule,
    NzTagModule,
    NzCardModule,
    NzTabsModule,
    NzDropDownModule,
    NzModalModule,
    NzToolTipModule
  ],
  exports: [
    // Ng zorro
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzLayoutModule,
    NzFormModule,
    NzSelectModule,
    NzCollapseModule,
    NzAutocompleteModule,
    NzTagModule,
    NzCardModule,
    NzTabsModule,
    NzMenuModule,
    NzDropDownModule,
    NzModalModule,
    NzToolTipModule,
    // modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GridsterModule,
    // components
    PriceTickComponent
  ],
  providers: [
    HandleErrorService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HandleErrorsInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
})
export class SharedModule { }
