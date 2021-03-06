import Editor from "visual/global/Editor";
import objectTraverse from "visual/utils/objectTraverse";
import { uuid } from "visual/utils/uuid";

const setIdsCb = (key, value, obj, options) => {
  const isArrayComponent = key === "type" && Editor.getComponent(value) != null;
  if (isArrayComponent) {
    obj.value = obj.value || {};

    if (obj.value._id !== undefined && options.keepExistingIds) {
      return;
    }

    obj.value._id = uuid();
  }
};

export default function setIds(componentValue, options = {}) {
  const clonedValue = JSON.parse(JSON.stringify(componentValue));

  objectTraverse(clonedValue, setIdsCb, options);

  return clonedValue;
}
