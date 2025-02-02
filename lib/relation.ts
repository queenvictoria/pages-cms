import { Config } from "@/types/config";

// @TODO Move to types
type OptionProps = string | {
  value: string,
  label: string
};

const getRelationsAsOptions = async (relationPath: string, config: Config|null): Promise<OptionProps[]> => {
  if (!config) return []

  const [name, fieldName, fieldLabel] = relationPath.split('|')
  // @FIX get path from schema
  const path = `src/data/${name}`

  const response = await fetch(
    `/api/${config.owner}/${config.repo}/${config.branch}/collections/${encodeURIComponent(name)}?path=${encodeURIComponent(path || schema.path)}`);

  if (!response.ok) throw new Error(`Failed to fetch collection: ${response.status} ${response.statusText}`);

  const data: any = await response.json();

  if (data.status !== "success") throw new Error(data.message);

  return data.data.contents.map((i: any) => {
    if (fieldLabel)
      return {
        value: i.object[fieldName],
        label: i.object[fieldLabel]
      }
    return i.object[fieldName]
  })
};

export {getRelationsAsOptions};
