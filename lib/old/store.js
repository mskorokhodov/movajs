import { State } from './state';

class Store {
  constructor() {
    this._state = new State();
    this._onUpdateCallbacks = [];
  }

  get data() {
    return this._state.data;
  }

  addListener(cb) {
    this._onUpdateCallbacks.push(cb);
  }

  removeListener(cb) {
    this._onUpdateCallbacks = this._onUpdateCallbacks.filter(item => item !== cb);
  }

  update(payload) {
    return this._requestStateUpdate(payload);
  }

  _requestStateUpdate(payload) {
    this._statePayload = { ...this._statePayload, ...payload };

    if (!this._requestedStateUpdateId) {
      this._requestedStateUpdateId = setTimeout(() => {
        this._state.update(this._statePayload)
        this._stateUpdated(this._statePayload);
      }, 0);
    }
  }

  _stateUpdated(update) {
    clearTimeout(this._requestedStateUpdateId);
    this._statePayload = {};
    this._requestedStateUpdateId = null;

    this._onUpdateCallbacks.forEach(cb => cb(update));
  }
}

export const store = new Store();