import type {CodegenConfig} from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "https://apidev.alor.ru/news/graphql",
  generates: {
    "projects/terminal-core-lib/src/features/news/graphql/schema/graphql.types.ts": {
      plugins: [
        {
          add: {
            placement: 'prepend',
            content: '/* eslint-disable */'
          }
        },
        {
          typescript: {
            declarationKind: 'interface',
            skipTypename: true,
            scalars: {
              DateTime: {
                input: 'string',
                output: 'string'
              },
              Decimal: {
                input: 'number',
                output: 'number'
              },
              Long: {
                input: 'number',
                output: 'number'
              }
            }
          }
        }
      ]
    },
    "projects/terminal-core-lib/src/features/news/graphql/schema/graphql.schemas.ts": {
      plugins: [
        {
          add: {
            placement: 'prepend',
            content: '/* eslint-disable */'
          }
        },
        {
          'typescript-validation-schema': {
            importFrom: './graphql.types',
            schema: 'zod',
            zodImportPath: 'zod/v3',
            scalarSchemas: {
              'DateTime': 'z.string()',
              'Decimal': 'z.number()',
              'Long': 'z.number()',
            },
            withObjectType: true
          }
        }
      ]
    }
  }
};

export default config;
