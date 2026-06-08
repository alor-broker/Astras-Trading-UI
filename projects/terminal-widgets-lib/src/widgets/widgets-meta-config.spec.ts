import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {cwd} from 'node:process';
import * as ts from 'typescript';

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
  it('should contain metadata for every widget registered in applications', () => {
    const missingWidgetMeta = widgetRegistryPaths
      .flatMap(registryPath => WidgetsMetaConfigSpecHelper.getMissingWidgetMeta(registryPath))
      .sort((left, right) => (
        left.registry.localeCompare(right.registry) || left.typeId.localeCompare(right.typeId)
      ));

    expect(missingWidgetMeta).toEqual([]);
  });
});
