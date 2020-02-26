export class Router {
  constructor(model, context) {
    this._onUpdateCallbacks = [];
    this._routes = [...model.routes];
    this._basePath = model.basePath || '';
    this._context = context || this;
    this._fallback = { path: '', render: () => null, ...model.fallback };
    this._update();

    this._popStateListener = window.addEventListener('popstate', () => this._update());
  }

  onUpdate(cb) {
    this._onUpdateCallbacks.push(cb);
  }

  get request() {
    return this._request;
  }

  _getRoutePath(route) {
    return (this._basePath + route.path).replace('//', '/');
  }

  _update() {
    this._currentRoute = this._findCurrentRoute();
    this._request = this._collectRequest();

    this._onUpdateCallbacks.forEach(cb => cb(this._request));
  }

  _splitPath(path) {
    return path.split('/').filter(x => x);
  }

  isCurrentRoute(route) {
    return new RegExp(`^${this._getRoutePath(route).replace(/(:)(.*)(\/?)/, '.*')}((/(.*))?)$`).test(location.pathname);
  }

  _findCurrentRoute() {
    const route = this._routes
      .sort((x, y) => x.path.length < y.path.length ? 1 : -1)
      .find((route) => this.isCurrentRoute(route));

    return route || this._fallback;
  }

  _collectRequest() {
    const request = {
      params: {},
      query: {},
    };

    request.path = location.pathname;

    request.query = location.search.slice(1).split('&').reduce((acc, param) => {
      const [key, value] = param.split('=');

      if (key) {
        if (acc[key]) {
          if (!Array.isArray(acc[key])) {
            acc[key] = [acc[key]];
          }
          acc[key].push(value);
        } else {
          acc[key] = value;
        }
      }

      return acc;
    }, {});

    if (this._currentRoute) {
      request.params = this._splitPath(this._currentRoute.path).reduce((acc, part, index) => {
        if (/^:/.test(part)) {
          acc[part.slice(1)] = this._splitPath(location.pathname.replace(this._basePath, ''))[index];
        }

        return acc;
      }, {});
    }

    return request;
  }

  navigate(url) {
    history.pushState({}, '', url);
    this._update();
  }

  renderView(options = {}) {
    if (this._currentRoute) {
      return this._currentRoute.render.call(this._context, this, options);
    }

    return null;
  }

  destroy() {
    window.removeEventListener('popstate', this._popStateListener);
  }
}

export const createRouter = (model) => new Router(model);