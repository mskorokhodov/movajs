import { State } from './state';

class Store {
  constructor() {
    this.__state = new State();
    this.__onUpdateCallbacks = [];
  }

  get data() {
    return this.__state.data;
  }

  addListener(cb) {
    this.__onUpdateCallbacks.push(cb);
  }

  removeListener(cb) {
    this.__onUpdateCallbacks = this.__onUpdateCallbacks.filter(item => item !== cb);
  }

  update(payload) {
    return this.__requestStateUpdate(payload);
  }

  __requestStateUpdate(payload) {
    this.__statePayload = { ...this.__statePayload, ...payload };

    if (!this.__requestedStateUpdateId) {
      this.__requestedStateUpdateId = setTimeout(() => {
        this.__state.update(this.__statePayload)
        this.__stateUpdated(this.__statePayload);
      }, 0);
    }
  }

  __stateUpdated(update) {
    clearTimeout(this.__requestedStateUpdateId);
    this.__statePayload = {};
    this.__requestedStateUpdateId = null;

    this.__onUpdateCallbacks.forEach(cb => cb(update));
  }
}

export const store = new Store();