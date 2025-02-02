"use client";
import { useConfig } from "@/contexts/config-context";
import { forwardRef, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {getRelationsAsOptions} from "@/lib/relation"

const EditComponent = forwardRef((props: any, _ref: React.Ref<HTMLSelectElement>) => {
  const { config } = useConfig();
  function getConfig() {
    return config
  }
  const { value, field, onChange } = props;
  const [values, setValues] = useState([]);

  useEffect(() => {
    if (field.options.values) {
      setValues(field.options.values)
    }
    else if (field.options?.relation) {
      getRelationsAsOptions(field.options.relation, config)
      .then((res: any) => {
          setValues(res);
        })
    }
  }, [config, field.options.relation, field.options?.values])

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values?.map((option: any) => {
          let value;
          let label;
          if (typeof option === "object") {
            value = option.value;
            label = option.label;
          } else {
            value = option;
            label = option;
          }
          return (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  )
});

EditComponent.displayName = "EditComponent";

export { EditComponent };
