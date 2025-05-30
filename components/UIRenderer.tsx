"use client";

import { ComponentData, UIComponent } from '@/types/chat';
import { useState, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface UIRendererProps {
  componentData: ComponentData;
}

export default function UIRenderer({ componentData }: UIRendererProps) {
  const { title, components, action } = componentData;

  return (
    <>
      {title && (
        <div className="text-lg font-semibold text-white mb-4">{title}</div>
      )}
      
      {components
        ?.filter(component => component && component.type)
        .map((component, index) => (
          <ComponentRenderer key={index} component={component} />
        ))}
      
      {action && (
        <div className="text-xs text-zinc-500 mt-3">
          Generated UI: {action}
        </div>
      )}
    </>
  );
}

// Individual component renderer
function ComponentRenderer({ component }: { component: UIComponent }) {
  const [Component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate component type before proceeding
        if (!component.type) {
          console.error('❌ Component type is undefined:', component);
          setError('Component type is undefined');
          return;
        }
        
        console.log(`🔍 Loading component: ${component.type}`);
        
        // Map component type to file name
        const getFileName = (componentType: string) => {
          console.log(`📁 Mapping component type: ${componentType}`);
          
          // Additional validation check
          if (!componentType) {
            console.error('❌ Component type is empty or undefined');
            throw new Error('Component type is required');
          }
          
          // Handle special cases where multiple components are in one file
          const fileMap: Record<string, string> = {
            // Alert Dialog components
            'AlertDialog': 'alert-dialog',
            'AlertDialogContent': 'alert-dialog',
            'AlertDialogHeader': 'alert-dialog',
            'AlertDialogTitle': 'alert-dialog',
            'AlertDialogDescription': 'alert-dialog',
            'AlertDialogAction': 'alert-dialog',
            'AlertDialogCancel': 'alert-dialog',
            'AlertDialogFooter': 'alert-dialog',
            'AlertDialogOverlay': 'alert-dialog',
            'AlertDialogPortal': 'alert-dialog',
            'AlertDialogTrigger': 'alert-dialog',
            
            // Dropdown Menu components
            'DropdownMenu': 'dropdown-menu',
            'DropdownMenuContent': 'dropdown-menu',
            'DropdownMenuItem': 'dropdown-menu',
            'DropdownMenuTrigger': 'dropdown-menu',
            'DropdownMenuLabel': 'dropdown-menu',
            'DropdownMenuSeparator': 'dropdown-menu',
            'DropdownMenuShortcut': 'dropdown-menu',
            'DropdownMenuGroup': 'dropdown-menu',
            'DropdownMenuPortal': 'dropdown-menu',
            'DropdownMenuSub': 'dropdown-menu',
            'DropdownMenuSubContent': 'dropdown-menu',
            'DropdownMenuSubTrigger': 'dropdown-menu',
            'DropdownMenuRadioGroup': 'dropdown-menu',
            'DropdownMenuCheckboxItem': 'dropdown-menu',
            'DropdownMenuRadioItem': 'dropdown-menu',
            
            // Context Menu components
            'ContextMenu': 'context-menu',
            'ContextMenuContent': 'context-menu',
            'ContextMenuItem': 'context-menu',
            'ContextMenuTrigger': 'context-menu',
            'ContextMenuLabel': 'context-menu',
            'ContextMenuSeparator': 'context-menu',
            'ContextMenuShortcut': 'context-menu',
            'ContextMenuGroup': 'context-menu',
            'ContextMenuPortal': 'context-menu',
            'ContextMenuSub': 'context-menu',
            'ContextMenuSubContent': 'context-menu',
            'ContextMenuSubTrigger': 'context-menu',
            'ContextMenuRadioGroup': 'context-menu',
            'ContextMenuCheckboxItem': 'context-menu',
            'ContextMenuRadioItem': 'context-menu',
            
            // Navigation Menu components
            'NavigationMenu': 'navigation-menu',
            'NavigationMenuList': 'navigation-menu',
            'NavigationMenuItem': 'navigation-menu',
            'NavigationMenuContent': 'navigation-menu',
            'NavigationMenuTrigger': 'navigation-menu',
            'NavigationMenuLink': 'navigation-menu',
            'NavigationMenuIndicator': 'navigation-menu',
            'NavigationMenuViewport': 'navigation-menu',
            
            // Table components - ALL in table.tsx!
            'Table': 'table',
            'TableBody': 'table',
            'TableCaption': 'table',
            'TableCell': 'table',
            'TableFooter': 'table',
            'TableHead': 'table',
            'TableHeader': 'table',
            'TableRow': 'table',
            
            // Card components
            'Card': 'card',
            'CardContent': 'card',
            'CardDescription': 'card',
            'CardFooter': 'card',
            'CardHeader': 'card',
            'CardTitle': 'card',
            
            // Dialog components
            'Dialog': 'dialog',
            'DialogClose': 'dialog',
            'DialogContent': 'dialog',
            'DialogDescription': 'dialog',
            'DialogFooter': 'dialog',
            'DialogHeader': 'dialog',
            'DialogOverlay': 'dialog',
            'DialogPortal': 'dialog',
            'DialogTitle': 'dialog',
            'DialogTrigger': 'dialog',
            
            // Sheet components
            'Sheet': 'sheet',
            'SheetClose': 'sheet',
            'SheetContent': 'sheet',
            'SheetDescription': 'sheet',
            'SheetFooter': 'sheet',
            'SheetHeader': 'sheet',
            'SheetOverlay': 'sheet',
            'SheetPortal': 'sheet',
            'SheetTitle': 'sheet',
            'SheetTrigger': 'sheet',
            
            // Tabs components
            'Tabs': 'tabs',
            'TabsContent': 'tabs',
            'TabsList': 'tabs',
            'TabsTrigger': 'tabs',
            
            // Select components
            'Select': 'select',
            'SelectContent': 'select',
            'SelectGroup': 'select',
            'SelectItem': 'select',
            'SelectLabel': 'select',
            'SelectSeparator': 'select',
            'SelectTrigger': 'select',
            'SelectValue': 'select',
            'SelectScrollDownButton': 'select',
            'SelectScrollUpButton': 'select',
            
            // Alert components
            'Alert': 'alert',
            'AlertDescription': 'alert',
            'AlertTitle': 'alert',
            
            // Avatar components
            'Avatar': 'avatar',
            'AvatarFallback': 'avatar',
            'AvatarImage': 'avatar',
            
            // Breadcrumb components
            'Breadcrumb': 'breadcrumb',
            'BreadcrumbEllipsis': 'breadcrumb',
            'BreadcrumbItem': 'breadcrumb',
            'BreadcrumbLink': 'breadcrumb',
            'BreadcrumbList': 'breadcrumb',
            'BreadcrumbPage': 'breadcrumb',
            'BreadcrumbSeparator': 'breadcrumb',
            
            // Form components
            'Form': 'form',
            'FormControl': 'form',
            'FormDescription': 'form',
            'FormField': 'form',
            'FormItem': 'form',
            'FormLabel': 'form',
            'FormMessage': 'form',
            
            // Popover components
            'Popover': 'popover',
            'PopoverContent': 'popover',
            'PopoverTrigger': 'popover',
            
            // Tooltip components
            'Tooltip': 'tooltip',
            'TooltipContent': 'tooltip',
            'TooltipProvider': 'tooltip',
            'TooltipTrigger': 'tooltip',
            
            // Toast components
            'Toast': 'toast',
            'ToastAction': 'toast',
            'ToastClose': 'toast',
            'ToastDescription': 'toast',
            'ToastProvider': 'toast',
            'ToastTitle': 'toast',
            'ToastViewport': 'toast',
            
            // Drawer components
            'Drawer': 'drawer',
            'DrawerClose': 'drawer',
            'DrawerContent': 'drawer',
            'DrawerDescription': 'drawer',
            'DrawerFooter': 'drawer',
            'DrawerHeader': 'drawer',
            'DrawerOverlay': 'drawer',
            'DrawerPortal': 'drawer',
            'DrawerTitle': 'drawer',
            'DrawerTrigger': 'drawer',
            
            // Other grouped components
            'InputOTP': 'input-otp',
            'InputOTPGroup': 'input-otp',
            'InputOTPSlot': 'input-otp',
            'InputOTPSeparator': 'input-otp',
            
            'HoverCard': 'hover-card',
            'HoverCardContent': 'hover-card',
            'HoverCardTrigger': 'hover-card',
            
            'ScrollArea': 'scroll-area',
            'ScrollBar': 'scroll-area',
            
            'ToggleGroup': 'toggle-group',
            'ToggleGroupItem': 'toggle-group',
            
            'RadioGroup': 'radio-group',
            'RadioGroupItem': 'radio-group',
            
            'Accordion': 'accordion',
            'AccordionItem': 'accordion',
            'AccordionTrigger': 'accordion',
            'AccordionContent': 'accordion',
            
            'Collapsible': 'collapsible',
            'CollapsibleContent': 'collapsible',
            'CollapsibleTrigger': 'collapsible',
            
            'Command': 'command',
            'CommandDialog': 'command',
            'CommandEmpty': 'command',
            'CommandGroup': 'command',
            'CommandInput': 'command',
            'CommandItem': 'command',
            'CommandList': 'command',
            'CommandSeparator': 'command',
            'CommandShortcut': 'command',
            
            'Menubar': 'menubar',
            'MenubarCheckboxItem': 'menubar',
            'MenubarContent': 'menubar',
            'MenubarGroup': 'menubar',
            'MenubarItem': 'menubar',
            'MenubarLabel': 'menubar',
            'MenubarMenu': 'menubar',
            'MenubarPortal': 'menubar',
            'MenubarRadioGroup': 'menubar',
            'MenubarRadioItem': 'menubar',
            'MenubarSeparator': 'menubar',
            'MenubarShortcut': 'menubar',
            'MenubarSub': 'menubar',
            'MenubarSubContent': 'menubar',
            'MenubarSubTrigger': 'menubar',
            'MenubarTrigger': 'menubar',
            
            'Pagination': 'pagination',
            'PaginationContent': 'pagination',
            'PaginationEllipsis': 'pagination',
            'PaginationItem': 'pagination',
            'PaginationLink': 'pagination',
            'PaginationNext': 'pagination',
            'PaginationPrevious': 'pagination',
            
            'ResizableHandle': 'resizable',
            'ResizablePanel': 'resizable',
            'ResizablePanelGroup': 'resizable',
            
            'Carousel': 'carousel',
            'CarouselContent': 'carousel',
            'CarouselItem': 'carousel',
            'CarouselNext': 'carousel',
            'CarouselPrevious': 'carousel',
            
            // Single component files
            'Button': 'button',
            'Input': 'input',
            'Label': 'label',
            'Textarea': 'textarea',
            'Switch': 'switch',
            'Checkbox': 'checkbox',
            'Slider': 'slider',
            'Progress': 'progress',
            'Skeleton': 'skeleton',
            'Separator': 'separator',
            'Badge': 'badge',
            'Toggle': 'toggle',
            'AspectRatio': 'aspect-ratio',
            'Calendar': 'calendar',
            'Sonner': 'sonner',
            'Toaster': 'toaster'
          };
          
          if (fileMap[componentType]) {
            console.log(`✅ Found in fileMap: ${componentType} -> ${fileMap[componentType]}`);
            return fileMap[componentType];
          }
          
          // Convert PascalCase to kebab-case for other components
          const kebabCase = componentType.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);
          console.log(`🔄 Converting to kebab-case: ${componentType} -> ${kebabCase}`);
          return kebabCase;
        };
        
        const fileName = getFileName(component.type);
        const importPath = `@/components/ui/${fileName}`;
        
        console.log(`📦 Import path: ${importPath}`);
        
        // Dynamic import of the component
        const module = await import(`@/components/ui/${fileName}`);
        
        console.log(`📋 Module exports:`, Object.keys(module));
        
        const ComponentToRender = module[component.type] || module.default;
        
        console.log(`🎯 Found component: ${component.type}?`, !!ComponentToRender);
        
        if (!ComponentToRender) {
          throw new Error(`Component ${component.type} not found in module. Available exports: ${Object.keys(module).join(', ')}`);
        }
        
        setComponent(() => ComponentToRender);
        console.log(`✅ Successfully loaded: ${component.type}`);
        
      } catch (err) {
        console.error(`❌ Failed to load component ${component.type}:`, err);
        console.error(`❌ Error details:`, {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(`Failed to load ${component.type}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [component.type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        <span className="ml-2 text-sm text-zinc-400">Loading {component.type}...</span>
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
        Component {component.type} could not be rendered
      </div>
    );
  }

  // Render children recursively if they exist
  const renderChildren = () => {
    if (component.children && component.children.length > 0) {
      return component.children
        .filter(child => child && child.type) // Filter out invalid components
        .map((child, index) => (
          <ComponentRenderer key={index} component={child} />
        ));
    }
    return component.props?.children || null;
  };

  // Check if component needs special wrapper handling
  const isTableComponent = ['Table', 'TableHeader', 'TableBody', 'TableFooter', 'TableRow'].includes(component.type);
  const isTableCellComponent = ['TableHead', 'TableCell', 'TableCaption'].includes(component.type);
  
  return (
    <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
      <ErrorBoundary componentName={component.type}>
        <Component {...component.props}>
          {renderChildren()}
        </Component>
      </ErrorBoundary>
    </Suspense>
  );
}

// Error boundary component
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