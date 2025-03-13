import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NodeBase} from "../../graph/nodes/node-base";
import {EditorType, ExtendedEditors, PortfolioKey, SlotType} from "../../graph/slot-types";
import {
  BooleanPropertyEditorConfig,
  DatePropertyEditorConfig,
  NumberPropertyEditorConfig,
  PortfolioPropertyEditorConfig,
  PropertyEditorConfig,
  StringPropertyEditorConfig
} from "../../models/property-editor.model";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {TranslocoDirective} from "@jsverse/transloco";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {queueScheduler, subscribeOn, take} from "rxjs";
import {LGraphCanvas} from "@comfyorg/litegraph";
import {
  StringPropertyEditorComponent
} from "../property-editors/string-property-editor/string-property-editor.component";
import {
  NumberPropertyEditorComponent
} from "../property-editors/number-property-editor/number-property-editor.component";
import {
  BooleanPropertyEditorComponent
} from "../property-editors/boolean-property-editor/boolean-property-editor.component";
import {
  DateValueValidationOptions,
  NodePropertyInfo,
  NumberValueValidationOptions,
  PortfolioValueValidationOptions,
  StringValueValidationOptions
} from "../../graph/nodes/models";
import {TextPropertyEditorComponent} from "../property-editors/text-property-editor/text-property-editor.component";
import {add} from "date-fns";
import {DatePropertyEditorComponent} from "../property-editors/date-property-editor/date-property-editor.component";
import {
  PortfolioPropertyEditorComponent
} from "../property-editors/portfolio-property-editor/portfolio-property-editor.component";

interface Editor {
  type: EditorType;
  config: PropertyEditorConfig;
}

interface EditorsSection {
  editors: Editor[];
}

@Component({
  selector: 'ats-node-properties-editor',
  standalone: true,
  imports: [
    NzEmptyComponent,
    TranslocoDirective,
    StringPropertyEditorComponent,
    NumberPropertyEditorComponent,
    BooleanPropertyEditorComponent,
    TextPropertyEditorComponent,
    DatePropertyEditorComponent,
    PortfolioPropertyEditorComponent
  ],
  templateUrl: './node-properties-editor.component.html',
  styleUrl: './node-properties-editor.component.less'
})
export class NodePropertiesEditorComponent implements OnChanges {
  @Input()
  targetNode: NodeBase | null = null;

  protected sections: EditorsSection[] = [];

  protected readonly SlotTypes = SlotType;
  protected readonly ExtendedEditors = ExtendedEditors;

  constructor(private readonly translatorService: TranslatorService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.targetNode != null) {
      if (changes.targetNode.currentValue == null) {
        this.sections = [];
      } else {
        this.initSections();
      }
    }
  }

  private initSections(): void {
    this.sections = [];
    this.translatorService.getTranslator('ai-graph/graph-editor').pipe(
      take(1),
      subscribeOn(queueScheduler)
    ).subscribe(translator => {
      this.initTitleEditor(translator);
      this.initNodePropertiesEditor(translator);
    });
  }

  private initTitleEditor(translator: TranslatorFn): void {
    if (this.targetNode?.titleLocked === false) {
      this.sections.push({
        editors: [
          this.createEditor<StringPropertyEditorConfig>(
            SlotType.String,
            {
              label: translator(['labels', 'blockTitle'], {falback: 'Block Title'}),
              initialValue: this.targetNode.getTitle(),
              validation: {
                minLength: 1,
                maxLength: 100
              },
              applyValueCallback: value => {
                const newTitle = value?.toString() ?? '';
                if (newTitle.length > 0) {
                  this.applyChanges(node => {
                    node.title = newTitle;
                  });
                }
              }
            }
          )
        ]
      });
    }
  }

  private initNodePropertiesEditor(translator: TranslatorFn): void {
    const editors: Editor[] = [];

    if (this.targetNode != null) {
      const node = this.targetNode;
      for (const propertyKey in node.properties) {
        const info = node.getPropertyInfo(propertyKey) as NodePropertyInfo;

        editors.push(this.createEditorForProperty(
          info,
          propertyKey,
          node,
          translator
        ));
      }
    }

    if (editors.length > 0) {
      this.sections.push({
        editors
      });
    }
  }

  private getPropertyLabel(
    propertyInfo: NodePropertyInfo,
    propertyKey: string,
    targetNode: NodeBase,
    translator: TranslatorFn
  ): string {
    if (targetNode.getPropertyLocalizedLabel) {
      return targetNode.getPropertyLocalizedLabel(propertyKey, translator);
    } else {
      return translator(['slots', propertyKey, 'name'], {fallback: propertyInfo.label});
    }
  }

  private applyChanges(change: (node: NodeBase) => void): void {
    if (this.targetNode != null) {
      change(this.targetNode);
      const canvas = LGraphCanvas.active_canvas;
      canvas.setDirty(true, true);
      canvas.graph?.afterChange();
    }
  }

  private createEditor<T extends PropertyEditorConfig<any>>(
    type: EditorType,
    config: T
  ): Editor {
    return {
      type,
      config
    };
  }

  private createEditorForProperty(
    propertyInfo: NodePropertyInfo,
    propertyKey: string,
    targetNode: NodeBase,
    translator: TranslatorFn
  ): Editor {
    const editorType = propertyInfo.editorType ?? (propertyInfo.type as SlotType);
    const label = this.getPropertyLabel(
      propertyInfo,
      propertyKey,
      targetNode,
      translator
    );

    switch (editorType) {
      case SlotType.String:
        return this.createStringEditor(propertyKey, propertyInfo, targetNode, label);
      case SlotType.Number:
        return this.createNumberEditor(propertyKey, propertyInfo, targetNode, label);
      case ExtendedEditors.MultilineText:
        return this.createTextEditor(propertyKey, propertyInfo, targetNode, label);
      case SlotType.Boolean:
        return this.createBooleanEditor(propertyKey, targetNode, label);
      case SlotType.Date:
        return this.createDateEditor(propertyKey, propertyInfo, targetNode, label);
      case SlotType.Portfolio:
        return this.createPortfolioEditor(propertyKey, propertyInfo, targetNode, label);
      default:
        return this.createStringEditor(propertyKey, propertyInfo, targetNode, label);
    }
  }

  private createStringEditor(
    propertyKey: string,
    propertyInfo: NodePropertyInfo,
    targetNode: NodeBase,
    label: string
  ): Editor {
    return this.createEditor<StringPropertyEditorConfig>(
      SlotType.String,
      {
        label,
        validation: (propertyInfo.validation as StringValueValidationOptions) ?? {
          minLength: 0,
          maxLength: 1000
        },
        initialValue: targetNode.properties[propertyKey] as (string | null),
        applyValueCallback: value => {
          this.applyChanges(node => {
            node.properties[propertyKey] = value;
          });
        }
      }
    );
  }

  private createTextEditor(
    propertyKey: string,
    propertyInfo: NodePropertyInfo,
    targetNode: NodeBase,
    label: string
  ): Editor {
    return {
      ...this.createStringEditor(
        propertyKey,
        propertyInfo,
        targetNode,
        label
      ),
      type: ExtendedEditors.MultilineText
    };
  }

  private createNumberEditor(
    propertyKey: string,
    propertyInfo: NodePropertyInfo,
    targetNode: NodeBase,
    label: string
  ): Editor {
    return this.createEditor<NumberPropertyEditorConfig>(
      SlotType.Number,
      {
        label,
        validation: (propertyInfo.validation as NumberValueValidationOptions) ?? {
          required: true,
          allowNegative: false,
          allowDecimal: false,
          step: 1,
          max: 1_000_000,
          min: -1_000_000
        },
        initialValue: targetNode.properties[propertyKey] as (number | null),
        applyValueCallback: value => {
          this.applyChanges(node => {
            node.properties[propertyKey] = value;
          });
        }
      }
    );
  }

  private createBooleanEditor(
    propertyKey: string,
    targetNode: NodeBase,
    label: string
  ): Editor {
    return this.createEditor<BooleanPropertyEditorConfig>(
      SlotType.Boolean,
      {
        label,
        initialValue: (targetNode.properties[propertyKey] as (boolean | null)) ?? false,
        applyValueCallback: value => {
          this.applyChanges(node => {
            node.properties[propertyKey] = value;
          });
        }
      }
    );
  }

  private createDateEditor(
    propertyKey: string,
    propertyInfo: NodePropertyInfo,
    targetNode: NodeBase,
    label: string
  ): Editor {
    const value = targetNode.properties[propertyKey] as (Date | null);

    return this.createEditor<DatePropertyEditorConfig>(
      SlotType.Date,
      {
        label,
        validation: (propertyInfo.validation as DateValueValidationOptions) ?? {
          required: true,
          allowFuture: false,
          min: add(
            new Date(),
            {
              years: -1
            }
          )
        },
        initialValue: value != null ? new Date(value) : null,
        applyValueCallback: value => {
          this.applyChanges(node => {
            node.properties[propertyKey] = value;
          });
        }
      }
    );
  }

  private createPortfolioEditor(
    propertyKey: string,
    propertyInfo: NodePropertyInfo,
    targetNode: NodeBase,
    label: string
  ): Editor {
    const value = targetNode.properties[propertyKey] as (PortfolioKey | null);

    return this.createEditor<PortfolioPropertyEditorConfig>(
      SlotType.Portfolio,
      {
        label,
        validation: (propertyInfo.validation as PortfolioValueValidationOptions) ?? {
          required: true
        },
        initialValue: value,
        applyValueCallback: value => {
          this.applyChanges(node => {
            node.properties[propertyKey] = value;
          });
        }
      }
    );
  }
}
