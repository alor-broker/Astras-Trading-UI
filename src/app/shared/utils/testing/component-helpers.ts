import {
  Component,
  Directive,
  EventEmitter
} from "@angular/core";

export class ComponentHelpers {
  static mockComponent(options: Component, klass = (class {
  })): unknown {
    const metadata: Component = {
      template: '<ng-content></ng-content>',
      ...options,
      standalone: options.standalone ?? false
    };
    const classWithOutputs = this.classWithOutputEmittersFactory(klass, options.outputs ?? []);

    return Component(metadata)(classWithOutputs);
  }

  static mockDirective(options: Directive, klass = (class {
  })): any {
    options.standalone ??= false;
    return Directive(options)(klass);
  }

  private static classWithOutputEmittersFactory(klass: any, outputs: string[]): { prototype: any, new: () => any } {
    outputs.forEach(output => {
      klass[output] = new EventEmitter();
    });

    return klass as { prototype: any, new: () => any };
  }
}
