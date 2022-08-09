import React from 'react';
import { Menu, Modal } from 'antd';
import { Layout } from 'flipper-plugin';
import { useState } from 'react';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
import { DataTable } from '../components/DataTable';
import ObjectAdder from '../components/ObjectAdder';
import { RealmDataInspector } from '../components/RealmDataInspector';
import { plugin } from '..';
import { usePlugin } from 'flipper-plugin';
import { TypeInput } from '../components/types/TypeInput';

type PropertyType = {
  objects: Array<RealmObject>;
  schemas: Array<SchemaObject>;
  selectedSchema: string;
  sortDirection: 'ascend' | 'descend' | null;
  loading: boolean;
  sortingColumn: string | null;
};

export const DataVisualizer = ({
  objects,
  schemas,
  selectedSchema,
  sortDirection,
  loading,
  sortingColumn,
}: PropertyType) => {
  const [inspectData, setInspectData] = useState<RealmObject>();
  const [inspectorView, setInspectorView] = useState<string>();
  const [showSidebar, setShowSidebar] = useState(false);
  const [goBackStack, setGoBackStack] = useState<Array<RealmObject>>([]);
  const [goForwardStack, setGoForwardStack] = useState<Array<RealmObject>>([]);
  const [editingCell, setEditingCell] = useState<{
    row: RealmObject;
    schemaProperty: SchemaProperty;
  }>();

  const [editingState, setEditingState] = useState<RealmObject>();

  // const [editingInfo, setEditingInfo] = useState<();
  const { removeObject, modifyObject } = usePlugin(plugin);

  const getCurrentSchema = () => {
    return schemas.find((schema) => schema.name === selectedSchema);
  };

  const currentSchema = getCurrentSchema();

  if (currentSchema === undefined) {
    return <>Please select a schema.</>;
  }
  const onOk = () => {
    // execute update
    console.log('row: ', editingCell);
    const pairs = Object.entries(editingCell.row).map(
      (value: [string, unknown]) => {
        return [value[0], value[1].value];
      }
    );
    console.log(pairs);
    const obj = new Object();
    pairs.forEach((val) => {
      if (val[1] != undefined) {
        obj[val[0]] = val[1];
      }
    });
    console.log('real obj:', obj);
    obj[editingCell?.schemaProperty.name] = editingState
    modifyObject(obj);
    onCancel();
  };
  const onCancel = () => {
    setEditingCell(undefined);
    setEditingState(undefined);
  };
  // Return buttons + tableView
  return (
    <Layout.Container grow>
      <ObjectAdder schema={currentSchema} />
      <Layout.ScrollContainer>
        <Layout.Container>
          <Modal
            title={'Edit'}
            visible={!!editingCell}
            onOk={onOk}
            onCancel={onCancel}
          >
            {editingCell ? (
              <TypeInput
                property={editingCell.schemaProperty}
                defaultValue={editingState}
                set={(val) => {
                  console.log('set', val);
                  setEditingState(val);
                }}
                extraProps={{ style: { width: '100%' } }}
              ></TypeInput>
            ) : null}
          </Modal>
          <TableView />
          <RealmDataInspector
            currentSchema={currentSchema}
            schemas={schemas}
            inspectData={inspectData}
            setInspectData={setInspectData}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            goBackStack={goBackStack}
            setGoBackStack={setGoBackStack}
            goForwardStack={goForwardStack}
            setGoForwardStack={setGoForwardStack}
            setNewInspectData={setNewInspectData}
            view={inspectorView}
          />
        </Layout.Container>
      </Layout.ScrollContainer>
    </Layout.Container>
  );

  function TableView() {
    if (currentSchema === undefined) {
      return <>Please select a schema.</>;
    }

    const deleteRow = (row: RealmObject) => {
      removeObject(row);
    };

    const editProperty = (row: RealmObject, schemaProperty: SchemaProperty) => {
      // console.log('row is', row)
      // console.log('value is', row[schemaProperty.name])
      setEditingState(row[schemaProperty.name].value);
      setEditingCell({
        row,
        schemaProperty,
      });
    };

    const dropDown = (
      row: RealmObject,
      schemaProperty: SchemaProperty,
      schema: SchemaObject
    ) => (
      <Menu>
        <Menu.Item key={-1} onClick={() => editProperty(row, schemaProperty)}>
          Edit property
        </Menu.Item>
        <Menu.Item key={0} onClick={() => {}}>
          Edit object
        </Menu.Item>
        <Menu.Item key={1} onClick={() => deleteRow(row)}>
          Delete selected {schema.name}{' '}
        </Menu.Item>
        <Menu.Item
          key={2}
          onClick={() => {
            setNewInspectData({ [schema.name]: schema });
            setInspectorView('Inspector - Realm Schema');
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Schema
        </Menu.Item>
        <Menu.Item
          key={3}
          onClick={() => {
            setNewInspectData({
              [schema.name + '.' + schemaProperty.name]: schemaProperty,
            });
            setInspectorView('Inspector - Realm Schema Property');
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Schema Property
        </Menu.Item>
        <Menu.Item
          key={4}
          onClick={() => {
            const object = {};
            Object.keys(row).forEach((key) => {
              object[key] = row[key].value;
            });
            setInspectorView('Inspector - Realm Object');
            setNewInspectData({ [schema.name]: object });
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Row
        </Menu.Item>
        <Menu.Item
          key={5}
          onClick={() => {
            setNewInspectData({
              [schema.name + '.' + schemaProperty.name]:
                row[schemaProperty.name].value,
            });
            setInspectorView('Inspector - Realm Object Property');
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Cell
        </Menu.Item>
      </Menu>
    );

    //  const columns = Object.keys(currentSchema.properties).map((key) => {
    const columns = currentSchema.order.map((key) => {
      const obj = currentSchema.properties[key];
      const isPrimaryKey = obj.name === currentSchema.primaryKey;
      return {
        name: obj.name,
        isOptional: obj.optional,
        objectType: obj.objectType,
        propertyType: obj.type,
        isPrimaryKey: isPrimaryKey,
      };
    });
    return (
      <Layout.Container height={800}>
        <DataTable
          columns={columns}
          objects={objects}
          schemas={schemas}
          sortDirection={sortDirection}
          sortingColumn={sortingColumn}
          selectedSchema={selectedSchema}
          loading={loading}
          renderOptions={dropDown}
        />
      </Layout.Container>
    );
  }

  // update inspectData and push object to GoBackStack
  function setNewInspectData(newInspectData: RealmObject) {
    if (inspectData !== undefined) {
      goBackStack.push(inspectData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    }
    setInspectData(newInspectData);
  }
};
