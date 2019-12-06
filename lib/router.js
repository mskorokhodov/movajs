export class Router {
  constructor(model, context) {
    this.__onUpdateCallbacks = [];
    this.__routes = model.routes;
    this.__basePath = model.basePath || '';
    this.__context = context || this;
    this.__fallback = { path: '', render: () => null, ...model.fallback };
    this.__update();

    this.__popStateListener = window.addEventListener('popstate', () => this.__update());
  }

  onUpdate(cb) {
    this.__onUpdateCallbacks.push(cb);
  }

  get request() {
    return this.__request;
  }

  __getRoutePath(route) {
    return (this.__basePath + route.path).replace('//', '/');
  }

  __update() {
    this.__currentRoute = this.__findCurrentRoute();
    this.__request = this.__collectRequest();

    this.__onUpdateCallbacks.forEach(cb => cb(this.__request));
  }

  __splitPath(path) {
    return path.split('/').filter(x => x);
  }

  __findCurrentRoute() {
    const route = this.__routes.sort((x, y) => x.path.length < y.path.length ? 1 : -1).find((route) => {
      return new RegExp(`^${this.__getRoutePath(route).replace(/(:)(.*)(\/?)/, '.*')}((/(.*))?)$`).test(location.pathname);
    });

    return route || this.__fallback;
  }

  __collectRequest() {
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

    if (this.__currentRoute) {
      request.params = this.__splitPath(this.__currentRoute.path).reduce((acc, part, index) => {
        if (/^:/.test(part)) {
          acc[part.slice(1)] = this.__splitPath(location.pathname.replace(this.__basePath, ''))[index];
        }

        return acc;
      }, {});
    }

    return request;
  }

  navigate(url) {
    history.pushState({}, '', url);
    this.__update();
  }

  renderView(options = {}) {
    if (this.__currentRoute) {
      return this.__currentRoute.render.call(this.__context, this.__request, options);
    }

    return null;
  }

  destroy() {
    window.removeEventListener('popstate', this.__popStateListener);
  }
}