class Store {
  static get defaults() {
    return {
      data: {},
      async: false
    };
  }

  constructor(options = {}) {
    options = { ...this.constructor.defaults, ...options };

    this._data = options.data;
    this._async = options.async;
    this._subscribers = [];
  }

  get data() {
    return this._data;
  }

  subscribe(callback) {
    this._subscribers.push({ callback });
  }

  subscribeOnce(callback) {
    this._subscribers.push({ callback, once: true });
  }

  update(payload) {
    if (this._async) {
      return this._requestUpdate(payload);
    }
    return this._update(payload);
  }

  _requestUpdate(payload) {
    this._payload = { ...this._payload, ...payload };

    if (!this._requestedUpdatePromise) {
      this._requestedUpdatePromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(this._update(this._payload));
          this._payload = {};
          this._requestedUpdatePromise = null;
        }, 0);
      });
    }

    return this._requestedUpdatePromise;
  }

  _update(payload) {
    this._data = { ...this._data, ...payload };
    this._notifySubscribers(payload);
    return this._data;
  }

  _notifySubscribers(payload) {
    this._subscribers.forEach(subscriber => typeof subscriber.callback === 'function' && subscriber.callback(payload));
    this._subscribers = this._subscribers.filter(subscriber => !subscriber.once);
  }
}

export const createStore = (...args) => new Store(...args);