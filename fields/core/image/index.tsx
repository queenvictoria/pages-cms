import { z, ZodIssueCode } from "zod";
import { ViewComponent } from "./view-component";
import { EditComponent } from "./edit-component";
import { Field } from "@/types/field";
import { swapPrefix } from "@/lib/githubImage";
import { getSchemaByName } from "@/lib/schema";
import { getFileExtension, extensionCategories } from "@/lib/utils/file";

// TODO: sanitize/normalize values on read (e.g. array to string, empty/invalid values)
const read = (value: any, field: Field, config: Record<string, any>): string | string[] | null => {
  if (!value) return null;
  if (Array.isArray(value) && !value.length) return null;
  
  const mediaConfig = (config?.object?.media?.length && field.options?.media !== false)
    ? field.options?.media && typeof field.options.media === 'string'
      ? getSchemaByName(config.object, field.options.media, "media")
      : config.object.media[0]
    : undefined;

  if (!mediaConfig) return value;

  if (Array.isArray(value)) {
    return value.map(v => read(v, field, config)) as string[];
  }

  return swapPrefix(value, mediaConfig.output, mediaConfig.input, true);
};

const write = (value: any, field: Field, config: Record<string, any>): string | string[] | null => {
  if (!value) return null;
  if (Array.isArray(value) && !value.length) return null;

  const mediaConfig = (config?.object?.media?.length && field.options?.media !== false)
    ? field.options?.media && typeof field.options.media === 'string'
      ? getSchemaByName(config.object, field.options.media, "media")
      : config.object.media[0]
    : undefined;

  if (!mediaConfig) return value;

  if (Array.isArray(value)) {
    return value.map(v => write(v, field, config)) as string[];
  }
  return swapPrefix(value, mediaConfig.input, mediaConfig.output);
};

const getAllowedExtensions = (field: Field, mediaConfig: any): string[] | undefined => {
  const baseExtensions = [...(extensionCategories['image'] || [])];

  if (!mediaConfig) return baseExtensions;
  if (!field.options?.extensions && !field.options?.categories) return mediaConfig?.extensions || baseExtensions;

  let extensions = baseExtensions;

  if (field.options?.extensions && Array.isArray(field.options?.extensions)) {
    extensions = [...field.options?.extensions];
  } else if (Array.isArray(field.options?.categories)) {
    extensions = field.options?.categories.flatMap(
      (category: string) => extensionCategories[category] || []
    );
  } else if (mediaConfig?.extensions && Array.isArray(mediaConfig.extensions)) {
    extensions = [...mediaConfig.extensions];
  }

  if (extensions.length > 0 && mediaConfig?.extensions && Array.isArray(mediaConfig.extensions)) {
    extensions = extensions.filter(ext => mediaConfig.extensions.includes(ext));
  }

  return extensions;
};

const schema = (field: Field, configObject?: Record<string, any>) => {
  const mediaConfig = configObject && (field.options?.media === false
    ? undefined
    : field.options?.media && typeof field.options.media === 'string'
      ? getSchemaByName(configObject, field.options.media, "media")
      : configObject.media?.[0]);
  const mediaInputPath = mediaConfig?.input;
  const allowedExtensions = getAllowedExtensions(field, mediaConfig);
  let zodSchema: z.ZodTypeAny;

  const isMultiple = !!field.options?.multiple;

  zodSchema = isMultiple
    ? z.array(z.string()).optional().nullable()
    : z.string().optional().nullable();

  zodSchema = zodSchema.superRefine((data, ctx) => {
    let isEmpty = false;
    let hasEmptyElementInArray = false;

    if (isMultiple) {
      isEmpty = data === null || data === undefined || data.length === 0;
      if (Array.isArray(data) && data.length > 0) {
          hasEmptyElementInArray = data.some(s => typeof s === 'string' && s === "");
      }
    } else {
      isEmpty = data === null || data === undefined || data === "";
    }

    if (field.required && isEmpty) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "This field is required",
      });
      // return; // Stop if empty element in array is considered critical
    }

    if (isMultiple && hasEmptyElementInArray) {
        ctx.addIssue({
            code: ZodIssueCode.custom,
            message: "Image path cannot be empty within the list.",
        });
       return;
    }

    if (isEmpty) return;

    // Path and extension checks
    const checkPath = (path: unknown) => {
      if (typeof path !== 'string' || path === "") return;

      // Path Prefix Check
      if (mediaInputPath && !path.startsWith(mediaInputPath)) {
        ctx.addIssue({ code: ZodIssueCode.custom, message: `Path must start with the media directory: ${mediaInputPath}` });
      }
      
      // Extension Check
      const fileExtension = getFileExtension(path);
      if (allowedExtensions && allowedExtensions.length > 0) {
        if (!allowedExtensions.includes(fileExtension)) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: `Invalid file extension '.${fileExtension}'. Allowed: ${allowedExtensions.map((e: string) => `.${e}`).join(', ')}`
          });
        }
      }
    };

    // Apply checks to array elements or single string
    if (isMultiple && Array.isArray(data)) {
      data.forEach(checkPath);
    } else if (!isMultiple && typeof data === 'string') {
      checkPath(data);
    }
  });

  return zodSchema;
};

const defaultValue = (field: Field) => {
  return field.options?.multiple ? [] : "";
};

const label = "Image";

export { label, schema, ViewComponent, EditComponent, read, write, defaultValue, getAllowedExtensions };