import { SchemaObject, SchemaProperty } from '../CommonTypes';
import { BooleanValue } from '../components/BooleanValue';
import React from 'react';

export const parsePropToCell = (
  value: string | number | Record<string, unknown>,
  property: SchemaProperty,
  schema: SchemaObject,
  schemas: Array<SchemaObject>
): JSX.Element | string | number => {
  if (value === null) {
    return 'null';
  }

  let returnValue: JSX.Element | string | number = '';

  switch (property.type) {
    case 'string':
      returnValue = '"' + parseSimpleData(value) + '"';
      break;
    case 'double':
    case 'int':
    case 'float':
    case 'objectId':
    case 'date':
    case 'uuid': //@ts-ignore --> These type errors are okay because the Realm data types guarantee type safety here.
      returnValue = parseSimpleData(value);
      break;
    case 'bool': //@ts-ignore
      returnValue = parseBoolean(value);
      break;
    case 'list':
    case 'set': //@ts-ignore
      //@ts-ignore
      returnValue = parseSetOrList(value);
      break;
    case 'data': //@ts-ignore
      returnValue = parseData(value);
      break;
    case 'dictionary': //@ts-ignore
      returnValue = parseDictionary(value);
      break;
    case 'decimal128': //@ts-ignore
      returnValue = parseDecimal128(value);
      break;
    case 'object': //@ts-ignore
      returnValue = parseLinkedObject(schema, schemas, value, property.name);
      break;
    case 'mixed':
      returnValue = parseMixed(value);
      break;
  }

  return returnValue;
};

function parseSimpleData(input: string | number): string | number {
  return input;
}

function parseSetOrList(input: any[]): string {
  const output = input.map((value) => {
    return parseJavaScriptTypes(value);
  });

  return '[' + output + ']';
}

function parseDictionary(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

function parseData(input) {
  const blob = new Blob([input]);
  // / Convert Blob to URL
  const blobUrl = URL.createObjectURL(blob);

  // Create an a element with blobl URL
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.target = '_blank';
  anchor.download = 'file';

  // Auto click on a element, trigger the file download
  // anchor.click();

  // Don't forget ;)
  // URL.revokeObjectURL(blobUrl);

  // const file = new File(input, 'fname');
  // console.log('parseData', new Uint8Array(input));
  // return <>
  // {'['+input.length+' bytes]'}
  // <Button onClick={() => anchor.click()} icon={<DownloadOutlined />}></Button>
  // </>;
  return (
    <a href={blobUrl} target="_blank" rel="noreferrer" download="file">
      aaa
    </a>
  );
  return anchor;
}

function parseBoolean(input: boolean): JSX.Element {
  const inputAsString = input.toString();

  return <BooleanValue active={input}> {inputAsString}</BooleanValue>;
}

function parseDecimal128(input: { $numberDecimal: string }): string {
  return input.$numberDecimal;
}

function parseLinkedObject(
  schema: SchemaObject,
  schemas: Array<SchemaObject>,
  linkedObj: Record<string, unknown>,
  key: string
): string {
  let returnValue = '';
  const childSchema: SchemaObject | undefined = schemas.find(
    (s) => s.name === schema.properties[key].objectType
  );
  if (childSchema !== undefined) {
    returnValue =
      '[' +
      childSchema.name +
      ']' +
      '.' +
      childSchema.primaryKey +
      ': ' +
      linkedObj[childSchema.primaryKey];
  }

  return returnValue;
}

function parseMixed(input: any): string {
  return JSON.stringify(input);
}

function parseJavaScriptTypes(input: any): string | number | JSX.Element {
  const type = typeof input;

  switch (type) {
    case 'string':
    case 'number':
    case 'symbol':
      return parseSimpleData(input);
    case 'boolean':
      return parseBoolean(input);
    case 'object':
      if (Array.isArray(input)) {
        return parseSetOrList(input);
      }
      //else if ('$numberDecimal' in input) {
      //   return input.$numberDecimal;
      //}
      else {
        return parseMixed(input);
      }
    case 'undefined':
    case 'bigint':
    case 'function':
    default:
      return input;
  }
}
