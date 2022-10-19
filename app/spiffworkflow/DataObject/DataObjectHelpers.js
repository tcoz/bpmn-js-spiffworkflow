/**
 * Returns the moddelElement if it is a process, otherwise, returns the
 *
 * @param container
 */


export function findDataObjects(parent) {
  let dataObjects = [];
  let process;
  if (!parent) {
    return [];
  }
  if (parent.processRef) {
    process = parent.processRef;
  } else {
    process = parent;
  }
  if (!process.flowElements) {
    console.log("Process has no flow elements!", process)
    return [];
  }
  for (const element of process.flowElements) {
    if (element.$type === 'bpmn:DataObject') {
      dataObjects.push(element);
    }
  }
  return dataObjects;
}

export function findDataObject(process, id) {
  for (const dataObj of findDataObjects(process)) {
    if (dataObj.id === id) {
      return dataObj;
    }
  }
}

export function findDataReferenceShapes(processShape, id) {
  let refs = [];
  for (const shape of processShape.children) {
    if (shape.type === 'bpmn:DataObjectReference') {
      if (shape.businessObject.dataObjectRef && shape.businessObject.dataObjectRef.id === id) {
        refs.push(shape);
      }
    }
  }
  return refs;
}
