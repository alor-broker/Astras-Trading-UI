import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {cwd} from 'node:process';
import * as ts from 'typescript';
import {WidgetCategory, WidgetMetaConfig} from '@terminal-core-lib/features/widgets-gallery/services/widgets-meta-service.types';
import {WIDGETS_GALLERY_DEFAULTS} from '@terminal-core-lib/features/widgets-gallery/types/widgets-gallery-defaults';

interface WidgetMetaConfigItem {
  typeId: string;
}

interface MissingWidgetMeta {
  registry: string;
  typeId: string;
}

const repoRoot = cwd();
const widgetsMetaConfigPath = join(
  repoRoot,
  'projects/terminal-widgets-lib/src/assets/widgets-meta-config.json'
);

const widgetRegistryPaths = [
  'projects/desktop-terminal/src/app/widget-registry.ts',
  'projects/mobile-terminal/src/app/widget-registry.ts',
  'projects/admin-terminal/src/app/widget-registry.ts'
] as const;

class WidgetsMetaConfigSpecHelper {
  static getMissingWidgetMeta(registryPath: string): MissingWidgetMeta[] {
    const widgetsMetaTypeIds = new Set(this.readWidgetsMetaTypeIds());
    const registryTypeIds = this.readWidgetRegistryTypeIds(registryPath);

    return registryTypeIds
      .filter(typeId => !widgetsMetaTypeIds.has(typeId))
      .map(typeId => ({
        registry: registryPath,
        typeId
      }));
  }

  private static readWidgetsMetaTypeIds(): string[] {
    const parsedConfig: unknown = JSON.parse(this.readTextFileWithoutBom(widgetsMetaConfigPath));

    if (!Array.isArray(parsedConfig)) {
      throw new Error(`${widgetsMetaConfigPath} must contain an array`);
    }

    return parsedConfig.map(item => this.parseWidgetMetaConfigItem(item)).map(item => item.typeId);
  }

  private static readWidgetRegistryTypeIds(registryPath: string): string[] {
    const absolutePath = join(repoRoot, registryPath);
    const sourceFile = ts.createSourceFile(
      registryPath,
      readFileSync(absolutePath, 'utf-8'),
      ts.ScriptTarget.Latest,
      true
    );
    const registryTypeIds = this.extractWidgetRegistryTypeIds(sourceFile);

    if (registryTypeIds.length === 0) {
      throw new Error(`${registryPath} must contain a widget registry Map`);
    }

    return registryTypeIds;
  }

  private static extractWidgetRegistryTypeIds(sourceFile: ts.SourceFile): string[] {
    const typeIds: string[] = [];

    const visit = (node: ts.Node): void => {
      if (ts.isNewExpression(node) && this.isMapExpression(node) && node.arguments?.[0] != null) {
        typeIds.push(...this.extractMapTypeIds(node.arguments[0]));
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return typeIds;
  }

  private static extractMapTypeIds(node: ts.Expression): string[] {
    if (!ts.isArrayLiteralExpression(node)) {
      return [];
    }

    return node.elements.flatMap(element => {
      if (!ts.isArrayLiteralExpression(element)) {
        return [];
      }

      const [typeIdNode] = element.elements;

      return typeIdNode != null && ts.isStringLiteral(typeIdNode)
        ? [typeIdNode.text]
        : [];
    });
  }

  private static parseWidgetMetaConfigItem(item: unknown): WidgetMetaConfigItem {
    if (!this.isRecord(item) || typeof item['typeId'] !== 'string') {
      throw new Error('Every widget meta config item must contain a string typeId');
    }

    return {
      typeId: item['typeId']
    };
  }

  private static readTextFileWithoutBom(path: string): string {
    const content = readFileSync(path, 'utf-8');

    return content.charCodeAt(0) === 0xFEFF
      ? content.slice(1)
      : content;
  }

  private static isMapExpression(node: ts.NewExpression): boolean {
    return ts.isIdentifier(node.expression) && node.expression.text === 'Map';
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value != null;
  }
}

describe('WidgetsMetaConfig', () => {
  it('should follow UI category order and ascending desktop gallery order within category ranges', () => {
    const widgets = JSON.parse(readFileSync(widgetsMetaConfigPath, 'utf-8').replace(/^\uFEFF/, '')) as WidgetMetaConfig[];
    const categories = Object.values(WidgetCategory);
    const categoryOrder = widgets.map(widget => categories.indexOf(widget.category));
    const desktopOrder = widgets.filter(widget => widget.desktopMeta != null).map(widget => widget.desktopMeta!.galleryOrder ?? Number.NaN);

    expect(categoryOrder.every(index => index >= 0)).toBe(true);
    expect(categoryOrder).toEqual([...categoryOrder].sort((left, right) => left - right));
    expect(desktopOrder).toEqual([...desktopOrder].sort((left, right) => left - right));
    expect(new Set(desktopOrder).size).toBe(desktopOrder.length);
    for (const widget of widgets.filter(item => item.desktopMeta != null)) {
      const categoryStart = categories.indexOf(widget.category) * 1000;
      expect(widget.desktopMeta!.galleryOrder).toBeGreaterThan(categoryStart);
      expect(widget.desktopMeta!.galleryOrder).toBeLessThan(categoryStart + 1000);
    }
  });

  it('should provide localized descriptions, valid expirations and existing default favorites', () => {
    const widgets = JSON.parse(readFileSync(widgetsMetaConfigPath, 'utf-8').replace(/^\uFEFF/, '')) as WidgetMetaConfig[];
    for (const widget of widgets) {
      expect(widget.description?.default, widget.typeId).toBeTruthy();
      for (const language of ['ru', 'en', 'hy']) {
        expect(widget.description?.translations?.[language], `${widget.typeId}: ${language}`).toBeTruthy();
      }
      if (widget.newUntil != null) {
        expect(Number.isFinite(Date.parse(widget.newUntil)), widget.typeId).toBe(true);
      }
    }
    const ids = new Set(widgets.map(widget => widget.typeId));
    for (const preferences of Object.values(WIDGETS_GALLERY_DEFAULTS)) {
      expect(preferences.favoriteWidgets.every(widget => ids.has(widget.typeId))).toBe(true);
    }
  });

  it('should contain metadata for every widget registered in applications', () => {
    const missingWidgetMeta = widgetRegistryPaths
      .flatMap(registryPath => WidgetsMetaConfigSpecHelper.getMissingWidgetMeta(registryPath))
      .sort((left, right) => (
        left.registry.localeCompare(right.registry) || left.typeId.localeCompare(right.typeId)
      ));

    expect(missingWidgetMeta).toEqual([]);
  });
});
