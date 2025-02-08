import { Config } from "@/types/config";
import { Option } from "@/types/field";

const getRelationsAsOptions = async (relationPath: string, config: Config|null): Promise<Option[]> => {
  if (!config) return []

  const [name, fieldName, fieldLabel] = relationPath.split('|')
  const schema = config.object.content.find((c: any) => c.name === name)
  if (!schema) return []
  const path = schema.path

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
