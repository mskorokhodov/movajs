MovaJS is a JavaScript library for building user interfaces.
# Installation
From inside your project folder, run:
```
npm install movajs
```
# Overview
MovaJS uses [lit-html](https://lit-html.polymer-project.org/) to render into the element's [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) and adds Functional API to manage element properties and state. See the [lit-html guide](https://lit-html.polymer-project.org/guide) for additional information on how to create templates for MovaJS.

## Element
```js
import { defineElement, html, css } from 'movajs';

const style = css`
  .timer {
    color: white;
  }

  .label {
    color: cyan;
  }

  .value {
    color: lightgreen;
  }
`;

export default defineElement('mova-counter', (context) => {
  // applies styles
  context.useStyle(style);

  // creates local reactive property
  const { get: getTimer, set: setTimer } = context.useState(0);
  // creates public reactive property
  const { get: getTimerInterval } = context.useProperty('timerInterval', { type: Number, default: 100 });
  // creates reference to DOM element
  const { get: getTimerElement, set: setTimerElement } = context.useReference(null);

  const handleMounted = () => {
    setInterval(() => setTimer(getTimer() + 1), getTimerInterval());
  };
  // subscribes on lifecycle
  context.useLifecycle('mounted', handleMounted);

  const handleUpdated = () => {
    const info = { timer: getTimer(), timerInterval: getTimerInterval(), timerElement: getTimerElement() };
    console.log('[updated]', info);
  };
  // subscribes on lifecycle
  context.useLifecycle('updated', handleUpdated);


  // render function
  return () => html`
    <div class="timer" ref=${setTimerElement}>
      <span>(</span>
      <span class="label">timer: </span>
      <span class="value">${getTimer()}</span>
      <span>)</span>
    </div>
  `;
});
```

```html
<mova-counter interval="1000"></mova-counter>
```

## Store
```js
import { createStore } from 'movajs';

const store = createStore({ data: { items: [] } });

export default useItems = (context) => {
  // subscribe element on store
  context.useStore(store);

  const getItems = (...itemsToAdd) => store.data.items;

  const addItems = (...itemsToAdd) => {
    const items = store.data.items.concat(...itemsToAdd);

    store.update({ items });
  };

  return { getItems, addItems };
};
```

```js
import { defineElement, html } from 'movajs';

import useItems from '../store/items';

export default defineElement('mova-element1', (context) => {
  // get store api
  const { getItems, addItems } = useItems(context);
  
  addItems('Item #1', 'Item #2', 'Item #3');

  return () => html`
    <div>${JSON.stringify(getItems())}</div>
  `;
});
```

```js
import { defineElement, html, createStore } from 'movajs';

import useItems from '../store/items';

export default defineElement('mova-element2', (context) => {
  // get store api
  const { getItems } = useItems(context);

  return () => html`
    <div>${JSON.stringify(getItems())}</div>
  `;
});
```