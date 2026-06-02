import {
  inject,
  Injectable
} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {MobileDashboardItemsActions} from '../store/actions';
import {MobileDashboardFeature} from '../store/reducer';

@Injectable()
export class MobileDashboardManageService {
  private readonly store = inject(Store);

  getInstrumentsHistory(): Observable<InstrumentKey[] | undefined> {
    return this.store.select(MobileDashboardFeature.instrumentsHistory);
  }

  addWidget(widgetType: string): void {
    this.store.dispatch(MobileDashboardItemsActions.addWidget(
      {
        widget: {
          widgetType: widgetType
        }
      }));
  }
}
