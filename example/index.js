import { defineElement, html } from '../lib';

export default defineElement('mova-app', (context) => {
  const { get: getTimer, set: setTimer } = context.useState(0);
  const { get: getTimerInterval } = context.useProperty('timerInterval', { type: Number, default: 100 });
  const { get: getTimerElement, set: setTimerElement } = context.useReference(null);

  context.useLifecycle('mounted', () => setInterval(() => setTimer(getTimer() + 1), getTimerInterval()));
  context.useLifecycle('updated', () => console.log('[updated]', getTimerElement().textContent));

  return () => html`
    <div ref=${setTimerElement}>(timer: ${getTimer()})</div>
  `;
});