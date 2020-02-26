import { defineElement, html, css } from '../lib';

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
    setInterval(() => setTimer(getTimer() + 1), getTimerInterval())
  };
  // subscribes on lifecycle
  context.useLifecycle('mounted', handleMounted);

  const handleUpdated = () => {
    const info = { timer: getTimer(), timerInterval: getTimerInterval(), timerElement: getTimerElement() };
    console.log('[updated]', info)
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