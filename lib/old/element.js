import { render } from 'lit-html';
import { State } from './state';
import { store } from './store';
import { Router } from '../router';

export class Element extends HTMLElement {
  static addSharedStyle(style) {
    Element._styleSheet.push(style);
    document.adoptedStyleSheets = [...Element._styleSheet];
  }

  constructor() {
    super();

    this._createProperties();
    this._createState();
    this._createRouter();
    this._connectToStore();

    this._renderRoot = this._createRoot();

    if (this.created) {
      this.created();
    }

    this._renderRoot.adoptedStyleSheets = [...Element._styleSheet];

    if (this.constructor.style) {
      this._styleSheet = this.constructor.style;
      this._renderRoot.adoptedStyleSheets = [...this._renderRoot.adoptedStyleSheets, this._styleSheet];
    }
  }

  connectedCallback() {
    this._grabPropertiesFromAttrs();

    this._update();

    if (this.mounted) {
      this.mounted();
    }
  }

  disconnectedCallback() {
    if (this.router) {
      this.router.destroy();
    }

    if (this._storeUpdatedBound) {
      store.removeListener(this._storeUpdatedBound);
    }

    if (this.unmounted) {
      this.unmounted();
    }
  }

  dispatch(name, detail, options = {}, element = this) {
    return element.dispatchEvent(new CustomEvent(name, { ...options, detail }));
  }

  listen(name, options = {}, element = this) {
    return element.addEventListener(name, { ...options });
  }

  createRef() {
    return { current: null };
  }

  _connectToStore() {
    if (this.storeUpdated) {
      this._storeUpdatedBound = this._storeUpdated.bind(this);
      store.addListener(this._storeUpdatedBound);
    }
  }

  updateStore(payload) {
    return store.update(payload);
  }

  get store() {
    return store.data;
  }

  _storeUpdated(update) {
    this.storeUpdated(update);
  }

  _createRoot() {
    return this.attachShadow({ mode: 'open' });
  }


  _createRouter() {
    if (this.constructor.router) {
      this._router = new Router(this.constructor.router, this);
      this._router.onUpdate(req => this._routerUpdated(req));
    }
  }

  _routerUpdated(req) {
    if (this.routerUpdated) {
      this.routerUpdated(req);
    }

    this._update();
  }

  get router() {
    return this._router;
  }


  _createProperties() {
    if (this.constructor.properties) {
      this._propsModel = this.constructor.properties;

      Object.keys(this._propsModel).forEach((name) => {
        if (this._propsModel[name] instanceof Function) {
          this._propsModel[name] = { type: this._propsModel[name] }
        }
      });

      this.properties = {};
      this.properties = new Proxy(this.properties, {
        set: (target, name, value) => {
          return Reflect.set(target, name, this._setProperty(name, value));
        }
      });
    }
  }

  _setProperty(name, value) {
    if (this._propsModel[name]) {
      if (this._propsModel[name].type) {
        value = this._validateProperty(name, this._propsModel[name], value);
      }

      this._propertiesUpdated({ [name]: value })

      if (this._propsModel[name].bindToState) {
        this.updateState({ [name]: value });
      }

      if (this._propsModel[name].bindToAttribute) {
        if (this._propsModel[name].type === Boolean) {
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
      throw new Error(`Prop '${name}' is not defined`);
    }
  }

  _validateProperty(name, model, value) {
    const error = new Error(`${value} is not assignable to type ${model.type.name}`);

    switch (model.type) {
      case String:
        if (value.toString) {
          return value.toString();
        } else {
          throw error;
        }
      case Number:
        const number = Number(value);

        if (!Number.isNaN(number)) {
          return number;
        } else {
          throw error;
        }
      case Boolean:
        return Boolean(value);
      case Array:
        if (Array.isArray(value)) {
          return value;
        } else {
          throw error;
        }
      case Object:
        if (typeof value === 'object' && !Array.isArray(value)) {
          return value;
        } else {
          throw error;
        }
      case Function:
        if (typeof value === 'function') {
          return value;
        } else {
          throw error;
        }
      default:
        return value;
    }
  }

  _grabPropertiesFromAttrs() {
    Array.from(this.attributes).forEach((attr) => {
      if (this._propsModel[attr.name]) {
        if (this._propsModel[attr.name].type === Boolean) {
          this.properties[attr.name] = true;
        } else {
          this.properties[attr.name] = attr.value;
        }
      }
    });
  }

  _propertiesUpdated(update) {
    if (this.propertiesUpdated) {
      this.propertiesUpdated(update);
    }
  }


  _createState() {
    this._state = new State(this.constructor.state);
  }

  get state() {
    return this._state.data;
  }

  updateState(payload) {
    this._state.update(payload);
    this._stateUpdated(payload);
  }

  _stateUpdated(update) {
    if (this.stateUpdated) {
      this.stateUpdated(update);
    }

    this._update();
  }

  _update() {
    if (this.render) {
      render(this.render(), this._renderRoot);
    }

    if (this.updated) {
      this.updated();
    }
  }
}

Element._styleSheet = [];