import React, { Component, cls } from 'react';
import { connect, state } from '@noflux/react';

export function createEditableListItem(components, options) {
  const [
    Editor,
    Viewer
  ] = components;
  const {
    entityName,
    validator
  } = options;
  const className = `${entityName}-list-item`;
  class EditableListItem extends Component {
    constructor(props) {
      super(props);
      const { model } = props;
      this.state = {
        input: model.$temp ? {} : { ...model },
        error: null,
        stage: model.$temp ? 'editor' : 'viewer'
      };
    }

    changeInput(key, value) {
      const { input } = this.state;
      input[key] = value;
      this.setState({ input });
    }
  
    activeInput() {
      this.setState({ stage: 'editor' });
    }
  
    cancelInput() {
      const { model } = this.props;
      // todo - confirm unsaved
      if (model.$temp) {
        // only remove temp item
        this.raiseRemove();
      } else {
        this.setState({ stage: 'viewer' });
      }
    }

    raiseSelect() {
      if (this.props.onSelect) {
        this.props.onSelect();
      }
    }
  
    raiseRemove() {
      if (this.props.onRemove) {
        this.props.onRemove();
      }
    }
  
    raiseUpdate() {
      const { input } = this.state;
      if (validator) {
        const error = validator(input);
        this.setState({ error });
        if (error) {
          console.error(error);
          return;
        }
      }
      this.setState({ stage: 'viewer' });
      if (this.props.onUpdate) {
        this.props.onUpdate(input);
      }
    }
  
    render() {
      const { stage, input } = this.state;
      const { model, selected } = this.props;
      return (
        <li className={cls(className, selected && 'active')}>
          { stage === 'editor' && (
            <Editor model={model} input={input}
              onCancel={() => this.cancelInput()}
              onUpdate={() => this.raiseUpdate()}
              onChange={(key, value) => this.changeInput(key, value)} />
          ) }
          { stage === 'viewer' && (
            <Viewer model={model} selected={selected}
              onSelect={() => this.raiseSelect()}
              onActive={() => this.activeInput()}
              onRemove={() => this.raiseRemove()} />
          ) }
        </li>
      );
    }
  }
  return EditableListItem;
}

export function createEditableList(components, options) {
  const [
    EditableListItem,
    HeaderView,
    FooterView
  ] = components;
  const {
    entityName,
    entityKey = 'key',
    dataSource,
  } = options;
  const className = `${entityName}-list`;
  class EditableList extends Component {
    constructor(props) {
      super(props);
      this.state = {
        model: []
      };
      this.idgen = 1;
      if (HeaderView) HeaderView.prototype.parent = this;
      if (FooterView) FooterView.prototype.parent = this;
    }

    createItem() {
      const { model } = this.state;
      model.unshift({ $temp: this.idgen });
      this.idgen += 1;
      this.setState({ model });
    }
  
    async selectItem(item) {
      await dataSource.select(item);
    }

    async removeItem(item) {
      if (!item.$temp) {
        await dataSource.delete(item);
      }
      const { model } = this.state;
      const i = model.indexOf(item);
      if (i >= 0) {
        model.splice(i, 1);
        this.setState({ model });
      }
    }
  
    async updateItem(item, next) {
      const result = await dataSource.update(item, next);
      const { model } = this.state;
      const i = model.indexOf(item);
      if (i >= 0) {
        model.splice(i, 1, result);
        this.setState({ model });
      }
    }

    reconcileModel() {
      const innerModel = this.state.model;
      const outerModel = dataSource.source();
      const model = [];
      innerModel.forEach(e => {
        if (e.$temp) model.push(e);
      });
      outerModel.forEach(eo => {
        const e = innerModel.find(ei => ei[entityKey] === eo[entityKey]);
        model.push(e || eo);
      });
      return model;
    }

    render() {
      const model = this.reconcileModel();
      return (
        <div className={className}>
          { HeaderView && (<HeaderView />) }
          { model.length > 0 && (
            <ul>
            { model.map((item) => {
              return (
                <EditableListItem key={item[entityKey] || `temp-${item.$temp}`} model={item} selected={item.selected}
                  onSelect={() => this.selectItem(item)}
                  onRemove={() => this.removeItem(item)} 
                  onUpdate={(input) => this.updateItem(item, input)} />
              );
            }) }
            </ul>
          ) }
          { FooterView && (<FooterView />) }
        </div>
      );
    }
  }
  return connect(EditableList);
}
