MovaJS is a JavaScript library for building user interfaces.
# Installation
From inside your project folder, run:
```
npm install movajs
```
# Overview
MovaJS uses [lit-html](https://lit-html.polymer-project.org/) to render into the element's [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) and adds Functional API to manage element properties and state. See the [lit-html guide](https://lit-html.polymer-project.org/guide) for additional information on how to create templates for MovaJS.
```js
import { defineElement, html } from '../lib';

export default defineElement('mova-counter', (context) => {
  // creates local reactive property
  const { get: getTimer, set: setTimer } = context.useState(0);
  // creates public reactive property
  const { get: getTimerInterval } = context.useProperty('timerInterval', { type: Number, default: 100 });
  // creates reference to DOM element
  const { get: getTimerElement, set: setTimerElement } = context.useReference(null);

  // subscribes on lifecycle
  context.useLifecycle('mounted', () => setInterval(() => setTimer(getTimer() + 1), getTimerInterval()));
  context.useLifecycle('updated', () => console.log('[updated]', getTimerElement().textContent));


  // render function
  return () => html`
    <div ref=${setTimerElement}>(timer: ${getTimer()})</div>
  `;
});
```

```html
<mova-counter interval="1000"></mova-counter>
```