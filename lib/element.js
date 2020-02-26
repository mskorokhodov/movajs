import { render } from 'lit-html';

import { createStore } from './store.js';
import { processProperty, generateId } from './helpers.js';

export class Element extends HTMLElement {
  connectedCallback() {
    this._renderRoot = this._createRenderRoot();
    this._state = this._createState();

    const { properties, proxy } = this._createProperties();
    this._properties = properties;
    this.properties = proxy;

    this._render = this._setup(this._getContext());

    this._collectPropertiesFromAttributes();

    this._update();
    this._notifySubscribers('lifecycle', 'mounted');
  }

  disconnectedCallback() {
    this._notifySubscribers('lifecycle', 'unmounted');
  }

  _createState() {
    const state = createStore();
    state.subscribe((update) => {
      Object.keys(update).forEach(id => this._notifySubscribers('state', id, update[id]));
      this._update();
    });

    return state;
  }

  _createProperties() {
    const properties = {};
    const proxy = new Proxy(properties, {
      set: (target, name, value) => {
        value = this._processProperty(name, value);
        const result = Reflect.set(target, name, value);

        this._notifySubscribers('property', name, value);

        return result;
      },
    });

    return { properties, proxy };
  }

  _processProperty(name, value) {
    name = this._getPropertyName(name);

    const model = this._propertiesModel[name];

    if (model) {
      value = processProperty(model, value);

      const { bindToAttribute, type } = model;

      if (bindToAttribute) {
        if (type === Boolean) {
          if (value) {
            this.setAttribute(name);
          } else {
            this.removeAttribute(name);
          }
        } else {
          this.setAttribute(name, value);
        }
      }

      return value;
    } else {
      throw new Error(`Property '${name}' is not used`);
    }
  }

  _getPropertyName(name) {
    return Object.keys(this._propertiesModel).find((propertyName) => propertyName.toLowerCase() === name.toLowerCase());
  }

  _collectPropertiesFromAttributes() {
    Array.from(this.attributes).forEach((attribute) => {
      const name = this._getPropertyName(attribute.name);
      const { value } = attribute;

      const model = this._propertiesModel[name];

      if (model) {
        const { type } = model;

        this.removeAttribute(attribute.name);

        if (type === Boolean) {
          this.properties[name] = true;
        } else {
          this.properties[name] = value;
        }
      }
    });
  }

  _subscribe(type, id, callback) {
    this._subscribers = this._subscribers || {};
    this._subscribers[type] = this._subscribers[type] || {};
    this._subscribers[type][id] = this._subscribers[type][id] || [];

    const newSubscriber = { callback };
    newSubscriber.unsubscribe = () => (this._subscribers[type][id] = this._subscribers[type][id].filter(subscriber => subscriber !== newSubscriber));

    this._subscribers[type][id].push(newSubscriber);

    return newSubscriber;
  }

  _notifySubscribers(type, id, ...args) {
    if (this._subscribers && this._subscribers[type] && this._subscribers[type][id]) {
      this._subscribers[type][id].forEach(subscriber => subscriber.callback(...args));
    }
  }

  _getContext() {
    return {
      useStyle: (...styleSheets) => {
        if (this.shadowRoot) {
          this.shadowRoot.adoptedStyleSheets = [...(this.shadowRoot.adoptedStyleSheets || {}), ...styleSheets];
        }
      },
      useStore: (store) => {
        store.subscribe(() => this._update());
      },
      useState: (initialValue) => {
        const id = generateId();

        this._state.data[id] = initialValue;

        const get = () => this._state.data[id];
        const set = (value) => this._state.update({ [id]: value });
        const onUpdate = (callback) => this._subscribe('state', id, callback);

        return { get, set, onUpdate };
      },
      useProperty: (name, model) => {
        this._propertiesModel = this._propertiesModel || {};

        if (model instanceof Function) {
          model = { type: model };
        }

        this._propertiesModel[name] = model;

        if (model.default) {
          this._properties[name] = model.default;
        }

        const get = () => this._properties[name];
        const set = (value) => (this.properties[name] = value);
        const onUpdate = (callback) => this._subscribe('property', name, callback);

        return { get, set, onUpdate };
      },
      useReference: (initialValue = null) => {
        const reference = { id: generateId(), current: initialValue };

        const get = () => reference.current;
        const set = (element) => {
          reference.current = element;
          this._notifySubscribers('reference', reference.id);
        };
        const onUpdate = (callback) => this._subscribe('reference', reference.id, callback);

        return { get, set, onUpdate };
      },
      useLifecycle: (type, callback) => this._subscribe('lifecycle', type, callback),
    }
  }

  _createRenderRoot() {
    return this.attachShadow({ mode: 'open' });
  }

  _update() {
    if (this._render) {
      this._notifySubscribers('lifecycle', 'wilUpdate');

      render(this._render(), this._renderRoot);

      this._notifySubscribers('lifecycle', 'updated');
    }
  }
}

export const defineElement = (name, setup) => {
  const ctor = class extends Element {
    _setup(ctx) {
      return setup(ctx);
    }
  }

  customElements.define(name, ctor);
}