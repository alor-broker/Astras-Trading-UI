import {Provider} from '@angular/core';
import {WidgetsMetaService} from './services/widgets-meta.service';

export function provideWidgetsGallery(): Provider[] {
  return [
    WidgetsMetaService
  ];
}
