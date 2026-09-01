import {Directive} from '@angular/core';

/** Marks content projected into the widget header. */
@Directive({
  selector: '[atsWidgetHeader]'
})
export class WidgetSkeletonHeaderSlot {
}

/** Marks the widget's regular content projected into the skeleton. */
@Directive({
  selector: '[atsWidgetContent]'
})
export class WidgetSkeletonContentSlot {
}
