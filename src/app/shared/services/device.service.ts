import { Injectable } from '@angular/core';
import { fromEvent } from "rxjs";
import { debounceTime, map, startWith } from "rxjs/operators";
import { mobileBreakpoint } from "../utils/device-helper";

interface WindowEvent extends Event {
  target: Window;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  deviceInfo$ = fromEvent<WindowEvent>(window, 'resize')
    .pipe(
      debounceTime(100),
      map(e => {
        return e.target.innerWidth;
      }),
      startWith(window.innerWidth),
      map(width => ({isMobile: width < mobileBreakpoint}))
    );
}
