import { is } from 'bpmn-js/lib/util/ModelUtil';
import { findDataObject, findDataObjectReferenceShapes, findDataObjects } from './DataObjectHelpers';

const LOW_PRIORITY = 500;

export default function DataObjectLabelEditingProvider(eventBus, canvas, directEditing, commandStack, modeling) {

    directEditing.registerProvider(LOW_PRIORITY, this);

    let el;

    // listen to dblclick on non-root elements
    eventBus.on('element.dblclick', function (event) {
        const { element } = event;
        if (is(element.businessObject, 'bpmn:DataObjectReference')) {
            let label = element.businessObject.name;
            label = label.replace(/\s*\[.*?\]\s*$/, '');
            modeling.updateLabel(element, label);
            directEditing.activate(element);
            el = element;
        }
    });

    eventBus.on('directEditing.activate', async function (event) {
        const { element } = event.active;
        if (is(element.businessObject, 'bpmn:DataObjectReference')) { }
    });

    eventBus.on('directEditing.complete', function (event) {

        const element = el;

        if (element && is(element.businessObject, 'bpmn:DataObjectReference')) {

            const process = element.parent.businessObject;
            const dataObject = findDataObject(process, element.businessObject.dataObjectRef.id);
            const dataState = element.businessObject.dataState && element.businessObject.dataState.name;

            let newLabel = element.businessObject.name;

            commandStack.execute('element.updateModdleProperties', {
                element,
                moddleElement: dataObject,
                properties: {
                    name: newLabel,
                },
            });

            // Update references name
            const references = findDataObjectReferenceShapes(element.parent.children, dataObject.id);
            for (const ref of references) {
                const stateName = ref.businessObject.dataState && ref.businessObject.dataState.name ? ref.businessObject.dataState.name : '';
                const newName = stateName ? `${newLabel} [${stateName}]` : newLabel;

                commandStack.execute('element.updateProperties', {
                    element: ref,
                    moddleElement: ref.businessObject,
                    properties: {
                        name: newName,
                    },
                    changed: [ref],
                });
            }

            // Append the data state if it exists
            if (dataState) {
                newLabel += ` [${dataState}]`;
            }

            // Update the label with the data state
            modeling.updateLabel(element, newLabel);

            el = undefined;
            
        }
    });

}

DataObjectLabelEditingProvider.$inject = [
    'eventBus',
    'canvas',
    'directEditing',
    'commandStack',
    'modeling'
];