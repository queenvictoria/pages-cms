export type Field = {
  name: string;
  label?: string | false;
  description?: string | null;
  type: "boolean" | "code" | "date" | "image" | "number" | "object" | "rich-text" | "select" | "string" | "text" | string;
  default?: any;
  list?: boolean | { min?: number; max?: number };
  hidden?: boolean | null;
  required?: boolean | null;
  pattern?: string | { regex: string; message?: string };
  options?: Record<string, unknown> | null;
  fields?: Field[];
};

export type Option = string | {
  value: string,
  label: string
};
