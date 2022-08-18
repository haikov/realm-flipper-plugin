import React from 'react';
import { Tag } from 'antd';
import { ColumnType } from '../components/DataTable';

export const ColumnTitle = ({
  optional,
  name,
  objectType,
  type,
  isPrimaryKey,
}: ColumnType) => {
  console.log('columntitle', type, objectType, isPrimaryKey)
  let title;

  switch (type) {
    case 'list':
    case 'set':
    case 'dictionary':
    case 'object':
      title = objectType;
      break;
    default:
      title = type;
  }

  if (optional) {
    title += '?';
  }

  switch (type) {
    case 'list':
      title += '[]';
      break;
    case 'set':
      title += '<>';
      break;
    case 'dictionary':
      title += '{}';
      break;
  }

  return isPrimaryKey ? (
    <div>
      {' '}
      {name + ' '} <Tag color="default">{title}</Tag>{' '}
      <Tag color="green">Primary Key</Tag>{' '}
    </div>
  ) : (
    <div>
      {' '}
      {name + ' '} <Tag color="default">{title}</Tag>
    </div>
  );
};
