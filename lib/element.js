import { render } from 'lit-html';
import { State } from './state';
import { store } from './store';
import { Router } from './router';

export class Element extends HTMLElement {
  static addSharedStyle(style) {
    Element.__styleSheet.push(style);
    document.adoptedStyleSheets = [...Element.__styleSheet];
  }

  constructor() {
    super();

    this.__createProperties();
    this.__createState();
    this.__createRouter();
    this.__connectToStore();

    this.__renderRoot = this.__createRoot();

    if (this.created) {
      this.created();
    }

    this.__renderRoot.adoptedStyleSheets = [...Element.__styleSheet];

    if (this.constructor.style) {
      this.__styleSheet = this.constructor.style;
      this.__renderRoot.adoptedStyleSheets = [...this.__renderRoot.adoptedStyleSheets, this.__styleSheet];
    }
  }

  connectedCallback() {
    this.__grabPropertiesFromAttrs();

    this.__update();

    if (this.mounted) {
      this.mounted();
    }
  }

  disconnectedCallback() {
    if (this.router) {
      this.router.destroy();
    }

    if (this.__storeUpdatedBound) {
      store.removeListener(this.__storeUpdatedBound);
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

  __connectToStore() {
    if (this.storeUpdated) {
      this.__storeUpdatedBound = this.__storeUpdated.bind(this);
      store.addListener(this.__storeUpdatedBound);
    }
  }

  updateStore(payload) {
    return store.update(payload);
  }

  get store() {
    return store.data;
  }

  __storeUpdated(update) {
    this.storeUpdated(update);
  }

  __createRoot() {
    return this.attachShadow({ mode: 'open' });
  }


  __createRouter() {
    if (this.constructor.router) {
      this.__router = new Router(this.constructor.router, this);
      this.__router.onUpdate(req => this.__routerUpdated(req));
    }
  }

  __routerUpdated(req) {
    if (this.routerUpdated) {
      this.routerUpdated(req);
    }

    this.__update();
  }

  get router() {
    return this.__router;
  }


  __createProperties() {
    if (this.constructor.properties) {
      this.__propsModel = this.constructor.properties;

      Object.keys(this.__propsModel).forEach((name) => {
        if (this.__propsModel[name] instanceof Function) {
          this.__propsModel[name] = { type: this.__propsModel[name] }
        }
      });

      this.properties = {};
      this.properties = new Proxy(this.properties, {
        set: (target, name, value) => {
          return Reflect.set(target, name, this.__setProperty(name, value));
        }
      });
    }
  }

  __setProperty(name, value) {
    if (this.__propsModel[name]) {
      if (this.__propsModel[name].type) {
        value = this.__validateProperty(name, this.__propsModel[name], value);
      }

      this.__propertiesUpdated({ [name]: value })

      if (this.__propsModel[name].bindToState) {
        this.updateState({ [name]: value });
      }

      if (this.__propsModel[name].bindToAttribute) {
        if (this.__propsModel[name].type === Boolean) {
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

  __validateProperty(name, model, value) {
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

  __grabPropertiesFromAttrs() {
    Array.from(this.attributes).forEach((attr) => {
      if (this.__propsModel[attr.name]) {
        if (this.__propsModel[attr.name].type === Boolean) {
          this.properties[attr.name] = true;
        } else {
          this.properties[attr.name] = attr.value;
        }
      }
    });
  }

  __propertiesUpdated(update) {
    if (this.propertiesUpdated) {
      this.propertiesUpdated(update);
    }
  }


  __createState() {
    this.__state = new State(this.constructor.state);
  }

  get state() {
    return this.__state.data;
  }

  updateState(payload) {
    this.__state.update(payload);
    this.__stateUpdated(payload);
  }

  __stateUpdated(update) {
    if (this.stateUpdated) {
      this.stateUpdated(update);
    }

    this.__update();
  }

  __update() {
    if (this.render) {
      render(this.render(), this.__renderRoot);
    }

    if (this.updated) {
      this.updated();
    }
  }
}

Element.__styleSheet = [];