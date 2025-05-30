import { Project, Node, Type, Symbol } from 'ts-morph';
import glob from 'fast-glob';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

interface ComponentInfo {
  name: string;
  hasExplicitProps: boolean;
  propsType?: string;
  isForwardRef: boolean;
  baseElement?: string;
}

async function buildRegistry() {
  const files = await glob('components/ui/**/*.tsx');
  const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

  const registry: Record<string, any> = {};

  // Ensure schemas directory exists
  if (!existsSync('schemas')) {
    mkdirSync('schemas');
  }

  // Ensure registry directory exists
  if (!existsSync('src/registry')) {
    mkdirSync('src/registry', { recursive: true });
  }

  for (const file of files) {
    try {
      console.log(`\nProcessing ${file}...`);
      const source = project.addSourceFileAtPath(file);
      const exports = source.getExportedDeclarations();
      
      // Get the component file name
      const fileName = path.basename(file, '.tsx');
      
      // Find all exported components and their info
      const components: ComponentInfo[] = [];
      const exportEntries = Array.from(exports.entries());
      
      for (const [exportName, declarations] of exportEntries) {
        // Skip utility exports
        if (exportName.endsWith('Variants') || exportName === 'default') {
          continue;
        }
        
        const decl = declarations[0];
        if (!decl) continue;
        
        // Check if it's a component
        const text = decl.getText();
        const isComponent = text.includes('React.forwardRef') || 
                          text.includes('React.FC') || 
                          text.includes('JSX.Element') ||
                          (decl.getKindName() === 'VariableDeclaration' && exportName[0] === exportName[0].toUpperCase());
        
        if (isComponent) {
          const componentInfo: ComponentInfo = {
            name: exportName,
            hasExplicitProps: false,
            isForwardRef: text.includes('React.forwardRef')
          };
          
          // Check if there's an explicit Props type
          const propsTypeName = `${exportName}Props`;
          if (exports.has(propsTypeName)) {
            componentInfo.hasExplicitProps = true;
            componentInfo.propsType = propsTypeName;
          } else if (text.includes('HTMLAttributes<')) {
            // Extract base element type
            const match = text.match(/HTMLAttributes<HTML(\w+)Element>/);
            if (match) {
              componentInfo.baseElement = match[1].toLowerCase();
            }
          }
          
          components.push(componentInfo);
        }
      }
      
      if (components.length === 0) {
        console.log(`  No components found in ${file}`);
        continue;
      }
      
      console.log(`  Found ${components.length} component(s): ${components.map(c => c.name).join(', ')}`);
      
      // For each component, try to generate schema or create basic documentation
      for (const component of components) {
        const schemaPath = `schemas/${component.name}.json`;
        let schemaGenerated = false;
        
        if (component.hasExplicitProps && component.propsType) {
          try {
            // Try to generate JSON-Schema for explicit props
            execSync(
              `npx ts-json-schema-generator --path ${file} --type ${component.propsType} --out ${schemaPath} --tsconfig tsconfig.json --no-type-check`,
              { stdio: 'pipe' }
            );
            schemaGenerated = true;
            console.log(`  ✅ Generated schema for ${component.name}`);
          } catch (schemaError: any) {
            console.log(`  ⚠️  Could not generate schema for ${component.name}: ${schemaError.message?.split('\n')[0] || 'Unknown error'}`);
          }
        }
        
        // If no schema was generated, create a basic schema
        if (!schemaGenerated) {
          const basicSchema: any = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "title": `${component.name} Props`,
            "description": `Props for ${component.name} component`,
            "properties": {
              "className": {
                "type": "string",
                "description": "Additional CSS classes"
              },
              "children": {
                "type": ["string", "object"],
                "description": "Child content"
              }
            },
            "additionalProperties": true
          };
          
          // Add common HTML attributes based on base element
          if (component.baseElement) {
            basicSchema.properties = {
              ...basicSchema.properties,
              "id": { "type": "string", "description": "Element ID" },
              "style": { "type": "object", "description": "Inline styles" },
              "onClick": { "type": "object", "description": "Click handler" }
            };
          }
          
          writeFileSync(schemaPath, JSON.stringify(basicSchema, null, 2));
          console.log(`  📝 Created basic schema for ${component.name}`);
        }
        
        // Add to registry
        registry[component.name] = {
          id: component.name,
          name: component.name,
          description: `${component.name} component from shadcn/ui`,
          importPath: `@/components/ui/${fileName}`,
          propsType: component.propsType || 'InferredProps',
          hasExplicitProps: component.hasExplicitProps,
          isForwardRef: component.isForwardRef,
          baseElement: component.baseElement,
          schemaPath: schemaPath,
          file: file
        };
      }
    } catch (error: any) {
      console.error(`Error processing ${file}:`, error.message || error);
    }
  }

  // Generate the registry file
  const registryContent = `// Auto-generated component registry
// Do not edit this file directly
// Generated on: ${new Date().toISOString()}

export interface ComponentRegistryItem {
  id: string;
  name: string;
  description: string;
  importPath: string;
  propsType: string;
  hasExplicitProps: boolean;
  isForwardRef: boolean;
  baseElement?: string;
  schemaPath: string;
  file: string;
}

export const componentRegistry: Record<string, ComponentRegistryItem> = ${JSON.stringify(registry, null, 2)};

// Dynamic import helper
export const loadComponent = async (componentName: string) => {
  const item = componentRegistry[componentName];
  if (!item) {
    throw new Error(\`Component \${componentName} not found in registry\`);
  }
  
  const module = await import(item.importPath);
  return module[componentName] || module.default;
};

// Get all component names
export const getComponentNames = () => Object.keys(componentRegistry);

// Get components by file
export const getComponentsByFile = (fileName: string) => {
  return Object.values(componentRegistry).filter(item => item.file.includes(fileName));
};

// Get component info
export const getComponentInfo = (componentName: string) => componentRegistry[componentName];

// Get all components that use forwardRef
export const getForwardRefComponents = () => {
  return Object.values(componentRegistry).filter(item => item.isForwardRef);
};

// Component count
export const componentCount = ${Object.keys(registry).length};
`;

  writeFileSync('src/registry/components.ts', registryContent);
  
  // Create a summary file
  const summaryContent = `# Component Registry Summary

Generated on: ${new Date().toISOString()}

## Statistics
- Total components: ${Object.keys(registry).length}
- Components with explicit props: ${Object.values(registry).filter((c: any) => c.hasExplicitProps).length}
- ForwardRef components: ${Object.values(registry).filter((c: any) => c.isForwardRef).length}

## Components by File

${Object.entries(
  Object.values(registry).reduce((acc: any, comp: any) => {
    const fileName = path.basename(comp.file);
    if (!acc[fileName]) acc[fileName] = [];
    acc[fileName].push(comp.name);
    return acc;
  }, {})
).map(([file, comps]: [string, any]) => `### ${file}
${comps.map((c: string) => `- ${c}`).join('\n')}
`).join('\n')}
`;

  writeFileSync('schemas/REGISTRY_SUMMARY.md', summaryContent);
  
  console.log(`\n✅ Registry built successfully!`);
  console.log(`📦 Total components registered: ${Object.keys(registry).length}`);
  console.log(`📁 Registry file: src/registry/components.ts`);
  console.log(`📁 Schema files: schemas/*.json`);
  console.log(`📄 Summary: schemas/REGISTRY_SUMMARY.md`);
}

// Run the script
buildRegistry().catch(console.error); 