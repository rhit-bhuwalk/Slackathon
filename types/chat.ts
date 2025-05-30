export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCall?: ToolCall;
}

export interface ToolCall {
  type: 'chart' | 'component' | 'conversation';
  name: string;
  data: ChartData | ComponentData | ConversationData;
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

export interface ConversationData {
  channel: string;
  messages: Array<SlackMessage>;
}

export interface SlackMessage {
  user?: string;
  text?: string;
  ts?: string;
  type?: string;
  subtype?: string;
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