import { createElement, patch } from '../src/index';
import Chart from 'chart.js/auto';
import confetti from 'canvas-confetti';

import appendManyRowsToLargeTable from './suites/appendManyRowsToLargeTable';
import clearRows from './suites/clearRows';
import createManyRows from './suites/createManyRows';
import createRows from './suites/createRows';
import partialUpdate from './suites/partialUpdate';
import removeRow from './suites/removeRow';
import replaceAllRows from './suites/replaceAllRows';
import selectRow from './suites/selectRow';
import swapRows from './suites/swapRows';

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  alert(
    'Please note that these benchmarks will be degraded and inaccurate on mobile. Usage is experimental on mobile devices and is not guaranteed to be functional or stable, proceed with caution.',
  );
}

const cumulative = {
  million: 0,
  'tiny-vdom': 0,
  'simple-virtual-dom': 0,
  'virtual-dom': 0,
  snabbdom: 0,
  DOM: 0,
  innerHTML: 0,
};
const logs = [];
const history = localStorage.logs && localStorage.logs.length ? JSON.parse(localStorage.logs) : [];
let disabled = false;

const suites = [
  appendManyRowsToLargeTable,
  clearRows,
  createManyRows,
  createRows,
  partialUpdate,
  removeRow,
  replaceAllRows,
  selectRow,
  swapRows,
].map((suite) =>
  suite
    .on('cycle', (event) => {
      log(event.target);
    })
    .on('complete', () => {
      log(`Fastest is ${suite.filter('fastest').map('name')}`);
      disabled = false;
      patch(el, vnode());
      localStorage.logs = JSON.stringify([...logs, ...history]);
      celebration();
    }),
);
const vnode = () => (
  <div>
    <div>
      {suites.map((suite) => {
        const [name, description] = suite.name.split('(');
        return (
          <button
            onclick={() => {
              disabled = name;
              logs.unshift([]);
              log(`Running: ${suite.name} - ${new Date().toLocaleString()}`);
              suite.run({ async: true });
              patch(el, vnode());
            }}
            style={{ margin: '5px', opacity: disabled && disabled !== name ? 0.25 : 1 }}
            disabled={disabled}
            title={description.slice(0, -1)}
          >{`${disabled === name ? '☑️ ' : ''}${name}`}</button>
        );
      })}
    </div>

    <br />

    <details open={!!logs.length}>
      <summary>Graph (Cumulative)</summary>
      <canvas id="viz" width="400" height="200"></canvas>
    </details>

    <br />

    <details open={!!logs.length}>
      <summary key="logs">Logs</summary>

      <div>{logs.map((logGroup) => logGroup.length && <pre>{logGroup.join('\n')}</pre>)}</div>
    </details>

    <br />

    {history.length ? (
      <details style={{ opacity: 0.5 }}>
        <summary key="history">History</summary>

        <div>{history.map((logGroup) => logGroup.length && <pre>{logGroup.join('\n')}</pre>)}</div>
      </details>
    ) : (
      ''
    )}
  </div>
);

const el = createElement(vnode());

const log = (message) => {
  if (message.name) cumulative[message.name] += Math.round(message.hz);
  logs[0].push(String(message));
  patch(el, vnode());
  console.log(String(message));
  const sortedKeys = Object.keys(cumulative).sort((a, b) => cumulative[b] - cumulative[a]);
  const sortedValues = sortedKeys.map((key) => cumulative[key]);
  const sortedBgColors = sortedKeys.map((key) =>
    key === 'million' ? 'rgba(255, 82, 76, 0.5)' : 'rgba(78, 35, 114, 0.5)',
  );
  const sortedBorderColors = sortedKeys.map((key) =>
    key === 'million' ? 'rgba(255, 82, 76, 1)' : 'rgba(78, 35, 114, 1)',
  );
  chart.data.labels = sortedKeys;
  chart.data.datasets[0].data = sortedValues;
  chart.data.datasets[0].backgroundColor = sortedBgColors;
  chart.data.datasets[0].borderColor = sortedBorderColors;
  chart.update();
};

document.body.appendChild(el);

const ctx = document.getElementById('viz');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: Object.keys(cumulative),
    datasets: [
      {
        label: 'operations/second',
        data: Object.values(cumulative),
        backgroundColor: Object.keys(cumulative).map((key) =>
          key === 'million' ? 'rgba(255, 82, 76, 0.5)' : 'rgba(78, 35, 114, 0.5)',
        ),
        borderColor: Object.keys(cumulative).map((key) =>
          key === 'million' ? 'rgba(255, 82, 76, 1)' : 'rgba(78, 35, 114, 1)',
        ),
        borderWidth: 1,
      },
    ],
  },
  options: {
    indexAxis: 'y',
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});
chart.options.animation = false;

const fire = (particleRatio, opts) => {
  confetti(
    Object.assign(
      {},
      {
        origin: { y: 0.7 },
      },
      opts,
      {
        particleCount: Math.floor(200 * particleRatio),
      },
    ),
  );
};

const celebration = () => {
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};
