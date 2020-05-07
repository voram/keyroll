import React, { Component } from 'react';
import { createEditableList } from './higher/editable';
import { Button, Input } from './design';
import VolumnListItem from './VolumnListItem';
import * as actions from '../actions';
import { state } from '@noflux/react';
import './VolumnList.scss';

class VolumnListHeader extends Component {
  render() {
    return (
      <div className='header'>
        <Input onChange={e => this.filterVolumn(e.target.value)} />
        <Button icon='add' onClick={() => this.parent.createItem()} />
      </div>
    );
  }
}

export default createEditableList(
  [
    VolumnListItem,
    VolumnListHeader
  ],
  {
    entityName: 'volumn',
    entityKey: 'name',
    dataSource: {
      select: async (item) => {
        const volumns = state.get('volumns');
        const index = volumns.findIndex(e => e.name === item.name);
        state.set('current.volumn', index);
        const records = await actions.findRecords({ volumn: item.name });
        state.set('records', records);
      },
      delete: (item) => {
        actions.killVolumn();
      },
      update: async (item, next) => {
        await actions.editVolumn({}, next);
        return next;
      }
    }
  }
);
