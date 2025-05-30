export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCall?: ToolCall;
}

export interface ToolCall {
  type: 'chart' | 'component' | 'email';
  name: string;
  data: ChartData | ComponentData | EmailData;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area' | string;
  title: string;
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  config: Record<string, any>;
  variant?: string;
}

export interface ComponentData {
  action: string;
  title?: string;
  components?: Array<UIComponent>;
  layout?: string;
  theme?: string;
}

export interface EmailData {
  action: 'send' | 'draft' | 'read' | 'search' | 'compose';
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  htmlBody?: string;
  attachments?: string[];
  messageId?: string;
  searchQuery?: string;
  results?: any[];
  status?: string;
  message?: string;
}

export interface UIComponent {
  type: string;
  props?: Record<string, any>;
  children?: Array<UIComponent>;
}

export interface ComponentInfo {
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