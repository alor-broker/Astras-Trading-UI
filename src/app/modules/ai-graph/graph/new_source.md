# Steps needed to implement a new data source node in the AI graph system:

1. Service Layer Setup:
   - If needed, create a new service in `src/app/shared/services/` that will handle data fetching
   - Service should be `@Injectable` and provided in 'root'
   - Add this service to `src/app/modules/ai-graph/services/graph-processing-context.service.ts` constructor and inject it

2. Model Definition:
   - Create necessary interfaces/models in `src/app/shared/models/` if needed
   - Define request/response types for the data

3. Create Data Source Node:
   - Create a new file in `src/app/modules/ai-graph/graph/nodes/info-sources/`
   - Extend `NodeBase` class from `src/app/modules/ai-graph/graph/nodes/node-base.ts`
   - Implement required static properties:
     - `nodeId` - unique identifier
     - `nodeCategory` - typically `NodeCategories.InfoSources` from `src/app/modules/ai-graph/graph/nodes/node-categories.ts`
     - node title for display

4. Node Implementation:
   - Define input/output slots:
     - Usually has an input slot for instruments
     - Output slot for the processed data
   - Define properties for configuration:
     - Add properties using `addProperty()`
     - Configure validation options if needed
   - Implement the `executor` method:
     - Handle input validation
     - Call the service to fetch data
     - Process the data
     - Format output

5. Localization:
   - Add translations in `src/assets/i18n/ai-graph/graph-editor/`:
     - Add entries for node title
     - Add entries for property names
     - Add entries for any displayed text
   - Add translations for both English (`en.json`) and Russian (`ru.json`) in the above directory

6. Node Registration:
   - Register the new node in `src/app/modules/ai-graph/graph/nodes/nodes-registry.ts` to make it available in the graph editor

Best Practices:
- Follow existing patterns from `src/app/modules/ai-graph/graph/nodes/info-sources/news-source-node.ts` and `quotes-source-node.ts`
- Use strong typing
- Implement proper error handling
- Use Observables for async operations
- Keep concerns separated (service layer vs node logic)
- Use dependency injection
- Validate all inputs
- Provide clear and translated labels
- Format output consistently with other nodes

The two main examples show slightly different approaches:
- NewsSourceNode (`news-source-node.ts`): Focuses on historical data with date filtering and batched loading
- QuotesSourceNode (`quotes-source-node.ts`): Focuses on real-time/current data with live updates

Choose the appropriate pattern based on your data source's characteristics.