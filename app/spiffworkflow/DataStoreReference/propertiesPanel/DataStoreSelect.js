import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import { isDataStoreReferenced, removeDataStore } from '../DataStoreHelpers';

export const OPTION_TYPE = {
  data_stores: 'data_stores',
};

export const spiffExtensionOptions = {};

export function DataStoreSelect(props) {

  const { id, label, description, optionType } = props;

  const { element } = props;
  const { commandStack } = props;
  const { modeling } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');
  const bpmnFactory = useService('bpmnFactory');

  const getValue = () => {
    const dtRef = element.businessObject.dataStoreRef;
    return dtRef
      ? `${dtRef.id}___${dtRef.name}`
      : '';
  };

  const setValue = (value) => {

    const splitValue = value.split('___');
    const valId = splitValue[0]
    const valClz = splitValue[1]

    if (!valId || valId == '') {
      modeling.updateProperties(element, {
        dataStoreRef: null,
      });
      return;
    }

    // Add DataStore to the BPMN model
    const process = element.businessObject.$parent;
    const definitions = process.$parent;
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }

    // Persist Current DataStore Ref
    const currentDataStoreRef = element.businessObject.dataStoreRef;

    // Create DataStore
    let dataStore = definitions.get('rootElements').find(element =>
      element.$type === 'bpmn:DataStore' && element.id === valId
    );

    // If the DataStore doesn't exist, create new one
    if (!dataStore) {
      dataStore = bpmnFactory.create('bpmn:DataStore', {
        id: valId,
        name: valClz
      });
      definitions.get('rootElements').push(dataStore);
    }

    modeling.updateProperties(element, {
      name: `Data Store (${valId})`,
      dataStoreRef: dataStore,
    });

    // Remove the old DataStore if it's no longer referenced
    if (currentDataStoreRef && !isDataStoreReferenced(process, currentDataStoreRef.id)) {
      removeDataStore(definitions, currentDataStoreRef.id);
    }
  };

  if (
    !(optionType in spiffExtensionOptions) ||
    spiffExtensionOptions[optionType] === null
  ) {
    spiffExtensionOptions[optionType] = null;
    requestOptions(eventBus, element, commandStack, optionType);
  }

  const getOptions = () => {
    const optionList = [];
    optionList.push({
      label: '',
      value: '',
    });
    if (
      optionType in spiffExtensionOptions &&
      spiffExtensionOptions[optionType] !== null
    ) {
      spiffExtensionOptions[optionType].forEach((opt) => {
        optionList.push({
          label: opt.name,
          value: `${opt.id}___${opt.clz}`,
        });
      });
    }
    return optionList;
  };

  return SelectEntry({
    id,
    element,
    label,
    description,
    getValue,
    setValue,
    getOptions,
    debounce,
  });
}

function requestOptions(eventBus, element, commandStack, optionType) {
  eventBus.on(`spiff.${optionType}.returned`, (event) => {
    spiffExtensionOptions[optionType] = event.options;
  });
  eventBus.fire(`spiff.${optionType}.requested`, { eventBus });
}