import {IContextMenuValue, LGraphCanvas, LiteGraph} from "@comfyorg/litegraph";
import {TranslatorFn} from "../../../../shared/services/translator.service";
import {ContextMenu} from "../nodes/models";
import {IContextMenuSubmenu} from "@comfyorg/litegraph/dist/interfaces";
import {NodeCategories} from "../nodes/node-categories";
import {NodesRegister} from "../nodes/nodes-register";

export class BackgroundMenuBuilder {
  static getMenu(translator: TranslatorFn): ContextMenu {
    const options: (IContextMenuValue | null)[] = [];

    const submenu = this.getNodeCategoriesMenu(translator);

    if (submenu.options != null && submenu.options.length > 0) {
      options.push({
          content: translator(['labels', 'addNode'], {falback: "Add Node"}),
          has_submenu: true,
          submenu
        }
      );
    }

    return {
      items: options,
    };
  }

  private static getNodeCategoriesMenu(translator: TranslatorFn): IContextMenuSubmenu {
    const options: IContextMenuValue[] = [];

    Object.values(NodeCategories).forEach((category) => {
      const nodes = this.getNodesForCategoryMenu(category, translator);

      if (nodes.length > 0) {
        options.push({
          content: translator(['categories', category], {falback: category}),
          has_submenu: true,
          submenu: {
            title: translator(['labels', 'blocks'], {falback: 'Blocks'}),
            options: nodes,
            callback: (value, subOptions, event, parent) => {
              const firstEvent = parent?.getFirstEvent() ?? event;
              const canvas = LGraphCanvas.active_canvas;
              canvas.graph?.beforeChange();
              const node = LiteGraph.createNode((value as any).value);
              if (node) {
                node.pos = canvas.convertEventToCanvasOffset(firstEvent!);
                canvas.graph?.add(node);
              }
              canvas.graph?.afterChange();
            }
          }
        });
      }
    });

    return {
      title: translator(['labels', 'categories'], {falback: 'Categories'}),
      options
    };
  }

  private static getNodesForCategoryMenu(category: NodeCategories, translator: TranslatorFn): IContextMenuValue[] {
    return NodesRegister.getRegistrationsForCategory(category).map(r => {
        return {
          content: translator(['nodes', r.class.title, 'title'], {falback: r.class.title}),
          value: r.type
        };
      }
    );
  }
}
