import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { concatMap } from 'rxjs/operators';
import { Observable, EMPTY } from 'rxjs';
import { WidgetsLocalStateActions } from './widgets-local-state.actions';

@Injectable()
export class WidgetsLocalStateEffects {

  constructor(private actions$: Actions) {}
}
