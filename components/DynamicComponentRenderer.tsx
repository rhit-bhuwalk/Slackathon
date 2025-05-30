"use client";

import { useState, useEffect, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface DynamicComponentRendererProps {
  componentName: string;
  importPath: string;
  showVariants?: boolean;
}

// Sample props for different components
const getSampleProps = (componentName: string) => {
  const samples: Record<string, any> = {
    // Buttons
    Button: [
      { children: "Primary Button" },
      { children: "Secondary", variant: "secondary" },
      { children: "Outline", variant: "outline" },
      { children: "Destructive", variant: "destructive" },
      { children: "Ghost", variant: "ghost" }
    ],
    
    // Input Components
    Input: [
      { placeholder: "Enter your email" },
      { type: "password", placeholder: "Password" },
      { value: "Sample text", readOnly: true }
    ],
    
    Textarea: [
      { placeholder: "Type your message here..." },
      { value: "This is a sample textarea content", rows: 3, readOnly: true }
    ],
    
    // Form Components
    Label: [{ children: "Email Address" }],
    Checkbox: [{ id: "terms" }],
    Switch: [{ id: "notifications" }],
    
    // Cards
    Card: [{ className: "w-64 p-4", children: "Sample card content" }],
    CardHeader: [{ children: "Card Header" }],
    CardTitle: [{ children: "Card Title" }],
    CardDescription: [{ children: "This is a card description" }],
    CardContent: [{ children: "Card content goes here" }],
    CardFooter: [{ children: "Card footer" }],
    
    // Alerts
    Alert: [{ children: "This is an alert message" }],
    AlertTitle: [{ children: "Alert Title" }],
    AlertDescription: [{ children: "This is the alert description" }],
    
    // Badges
    Badge: [
      { children: "Default" },
      { children: "Secondary", variant: "secondary" },
      { children: "Destructive", variant: "destructive" },
      { children: "Outline", variant: "outline" }
    ],
    
    // Avatar
    Avatar: [{ className: "h-10 w-10" }],
    AvatarImage: [{ src: "/api/placeholder/40/40", alt: "Avatar" }],
    AvatarFallback: [{ children: "JD" }],
    
    // Progress
    Progress: [
      { value: 33, className: "w-[60%]" },
      { value: 66, className: "w-[60%]" },
      { value: 100, className: "w-[60%]" }
    ],
    
    // Skeleton
    Skeleton: [
      { className: "h-4 w-[250px]" },
      { className: "h-4 w-[200px]" },
      { className: "h-4 w-[150px]" }
    ],
    
    // Separator
    Separator: [{ className: "my-4" }],
    
    // Tabs
    Tabs: [{ defaultValue: "tab1", className: "w-[400px]" }],
    TabsList: [{ className: "grid w-full grid-cols-2" }],
    TabsTrigger: [{ value: "tab1", children: "Tab 1" }],
    TabsContent: [{ value: "tab1", children: "Tab content here" }],
    
    // Navigation
    Breadcrumb: [{}],
    BreadcrumbList: [{}],
    BreadcrumbItem: [{}],
    BreadcrumbLink: [{ href: "#", children: "Home" }],
    BreadcrumbPage: [{ children: "Current Page" }],
    BreadcrumbSeparator: [{}],
    
    // Table
    Table: [{}],
    TableHeader: [{}],
    TableBody: [{}],
    TableFooter: [{}],
    TableHead: [{ children: "Header" }],
    TableRow: [{}],
    TableCell: [{ children: "Cell content" }],
    
    // Fallback for unknown components
    default: [
      { children: "Sample content" },
      { className: "p-2 border rounded" }
    ]
  };
  
  return samples[componentName] || samples.default;
};

export default function DynamicComponentRenderer({ 
  componentName, 
  importPath, 
  showVariants = false 
}: DynamicComponentRendererProps) {
  const [Component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Dynamic import of the component
        const module = await import(`@/components/ui/${importPath.split('/').pop()}`);
        const ComponentToRender = module[componentName] || module.default;
        
        if (!ComponentToRender) {
          throw new Error(`Component ${componentName} not found in module`);
        }
        
        setComponent(() => ComponentToRender);
      } catch (err) {
        console.error(`Failed to load component ${componentName}:`, err);
        setError(`Failed to load ${componentName}`);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [componentName, importPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        <span className="ml-2 text-sm text-zinc-400">Loading {componentName}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-sm text-red-400 bg-red-950 border border-red-800 rounded">
        {error}
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="p-3 text-sm text-yellow-400 bg-yellow-950 border border-yellow-800 rounded">
        Component {componentName} could not be rendered
      </div>
    );
  }

  const sampleProps = getSampleProps(componentName);
  const propsToShow = showVariants ? sampleProps : sampleProps.slice(0, 1);

  return (
    <div className="space-y-3">
      {propsToShow.map((props: any, index: number) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded border border-zinc-700">
          <div className="flex-shrink-0">
            <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
              <ErrorBoundary componentName={componentName}>
                <Component {...props} />
              </ErrorBoundary>
            </Suspense>
          </div>
          {showVariants && propsToShow.length > 1 && (
            <div className="text-xs text-zinc-500 font-mono">
              {JSON.stringify(props, null, 2)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Error boundary component to catch rendering errors
function ErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: React.ReactNode; 
  componentName: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [componentName]);

  if (hasError) {
    return (
      <div className="p-2 text-xs text-orange-400 bg-orange-950 border border-orange-800 rounded">
        Failed to render {componentName}
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    setHasError(true);
    return (
      <div className="p-2 text-xs text-orange-400 bg-orange-950 border border-orange-800 rounded">
        Render error: {componentName}
      </div>
    );
  }
} 