import { initBackend as initSQLBackend } from 'absurd-sql/dist/indexeddb-main-thread';
// eslint-disable-next-line import/no-unresolved
import { registerSW } from 'virtual:pwa-register';

import * as Platform from 'loot-core/shared/platform';

// eslint-disable-next-line typescript-paths/absolute-parent-import
import packageJson from '../package.json';

const backendWorkerUrl = new URL('./browser-server.js', import.meta.url);

// This file installs global variables that the app expects.
// Normally these are already provided by electron, but in a real
// browser environment this is where we initialize the backend and
// everything else.

const IS_DEV = process.env.NODE_ENV === 'development';
const ACTUAL_VERSION = Platform.isPlaywright
  ? '99.9.9'
  : process.env.REACT_APP_REVIEW_ID
    ? '.preview'
    : packageJson.version;

// *** Start the backend ***
let worker = null;

function createBackendWorker() {
  worker = new Worker(backendWorkerUrl);
  initSQLBackend(worker);

  if (window.SharedArrayBuffer) {
    localStorage.removeItem('SharedArrayBufferOverride');
  }

  worker.postMessage({
    type: 'init',
    version: ACTUAL_VERSION,
    isDev: IS_DEV,
    publicUrl: process.env.PUBLIC_URL,
    hash: process.env.REACT_APP_BACKEND_WORKER_HASH,
    isSharedArrayBufferOverrideEnabled: localStorage.getItem(
      'SharedArrayBufferOverride',
    ),
  });
}

createBackendWorker();

let isUpdateReadyForDownload = false;
let markUpdateReadyForDownload;
const isUpdateReadyForDownloadPromise = new Promise(resolve => {
  markUpdateReadyForDownload = () => {
    isUpdateReadyForDownload = true;
    resolve(true);
  };
});
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh: markUpdateReadyForDownload,
});

global.Actual = {
  IS_DEV,
  ACTUAL_VERSION,

  logToTerminal: (...args) => {
    console.log(...args);
  },

  relaunch: () => {
    window.location.reload();
  },

  reload: () => {
    if (window.navigator.serviceWorker == null) return;

    // Unregister the service worker handling routing and then reload. This should force the reload
    // to query the actual server rather than delegating to the worker
    return window.navigator.serviceWorker
      .getRegistration('/')
      .then(registration => {
        if (registration == null) return;
        return registration.unregister();
      })
      .then(() => {
        window.location.reload();
      });
  },

  startSyncServer: () => {},

  stopSyncServer: () => {},

  isSyncServerRunning: () => false,

  startOAuthServer: () => {
    return '';
  },

  restartElectronServer: () => {},

  openFileDialog: async ({ filters = [] }) => {
    console.error('� openFileDialog llamado con filtros:', filters);

    return new Promise(resolve => {
      let createdElement = false;
      // Attempt to reuse an already-created file input.
      let input = document.body.querySelector(
        'input[id="open-file-dialog-input"]',
      );
      if (!input) {
        createdElement = true;
        input = document.createElement('input');
      }

      input.type = 'file';
      input.id = 'open-file-dialog-input';
      input.value = null;

      const filter = filters.find(filter => filter.extensions);
      if (filter) {
        console.error('� Extensiones solicitadas:', filter.extensions);

        // Detectar tipos problemáticos que necesitan tratamiento especial
        const hasXLSX = filter.extensions.includes('xlsx');
        const hasPDF = filter.extensions.includes('pdf');
        const needsSpecialHandling = hasXLSX || hasPDF;

        console.error('📊 XLSX detectado:', hasXLSX);
        console.error('📄 PDF detectado:', hasPDF);
        console.error('🔧 Necesita manejo especial:', needsSpecialHandling);

        if (needsSpecialHandling) {
          // CONFIGURACIÓN INTELIGENTE para tipos problemáticos
          const acceptValues = [];

          // Añadir extensiones normales (que ya funcionaban)
          const normalExtensions = filter.extensions.filter(
            ext => !['xlsx', 'pdf'].includes(ext),
          );
          normalExtensions.forEach(ext => {
            acceptValues.push('.' + ext);
          });

          // Para XLSX y PDF, usar múltiples enfoques
          if (hasXLSX) {
            acceptValues.push('.xlsx');
            acceptValues.push(
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
          }

          if (hasPDF) {
            acceptValues.push('.pdf');
            acceptValues.push('application/pdf');
          }

          input.accept = acceptValues.join(',');
          console.error('✅ Configuración inteligente aplicada:', input.accept);
        } else {
          // Configuración normal para archivos que ya funcionaban bien
          input.accept = filter.extensions.map(ext => '.' + ext).join(',');
          console.error('⚙️ Configuración estándar:', input.accept);
        }
      } else {
        console.error('❌ No se encontró filtro con extensiones');
      }

      input.style.position = 'absolute';
      input.style.top = '0px';
      input.style.left = '0px';
      input.style.display = 'none';
      input.onchange = e => {
        const fileCount = e.target.files.length;
        console.error(`📁 Archivo(s) seleccionado(s): ${fileCount}`);

        if (fileCount > 0) {
          const file = e.target.files[0];
          const filename = file.name.replace(/.*(\.[^.]*)/, 'file$1');
          const isXLSX = file.name.toLowerCase().endsWith('.xlsx');
          const isPDF = file.name.toLowerCase().endsWith('.pdf');

          console.error(
            `✅ Archivo: ${file.name} (${file.type || 'sin tipo MIME'}) - ${file.size} bytes`,
          );
          if (isXLSX) console.error('📊 Tipo: XLSX detectado');
          if (isPDF) console.error('📄 Tipo: PDF detectado');

          const reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onload = async function (ev) {
            const filepath = `/uploads/${filename}`;
            console.error('📤 Subiendo archivo:', filepath);

            window.__actionsForMenu
              .uploadFile(filename, ev.target.result)
              .then(() => {
                console.error('🏆 Subida exitosa para:', file.name);
                resolve([filepath]);
              });
          };
          reader.onerror = function () {
            console.error('❌ Error leyendo archivo:', file.name);
          };
        } else {
          console.error('❌ No se seleccionó ningún archivo');
          resolve([]);
        }
      };

      // In Safari the file input has to be in the DOM for change events to
      // reliably fire.
      if (createdElement) {
        document.body.appendChild(input);
        console.error('📎 Input añadido al DOM');
      }

      console.error('🚀 Abriendo diálogo con accept:', input.accept);
      input.click();
    });
  },

  saveFile: (contents, defaultFilename) => {
    const temp = document.createElement('a');
    temp.style = 'display: none';
    temp.download = defaultFilename;
    temp.rel = 'noopener';

    const blob = new Blob([contents]);
    temp.href = URL.createObjectURL(blob);
    temp.dispatchEvent(new MouseEvent('click'));
  },

  openURLInBrowser: url => {
    window.open(url, '_blank');
  },
  onEventFromMain: () => {},
  isUpdateReadyForDownload: () => isUpdateReadyForDownload,
  waitForUpdateReadyForDownload: () => isUpdateReadyForDownloadPromise,
  applyAppUpdate: async () => {
    updateSW();

    // Wait for the app to reload
    await new Promise(() => {});
  },
  updateAppMenu: () => {},

  ipcConnect: () => {},
  getServerSocket: async () => {
    return worker;
  },

  setTheme: theme => {
    window.__actionsForMenu.saveGlobalPrefs({ prefs: { theme } });
  },

  moveBudgetDirectory: () => {},
};

function inputFocused(e) {
  return (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA' ||
    e.target.isContentEditable
  );
}

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey) {
    // Cmd/Ctrl+o
    if (e.key === 'o') {
      e.preventDefault();
      window.__actionsForMenu.closeBudget();
    }
    // Cmd/Ctrl+z
    else if (e.key.toLowerCase() === 'z') {
      if (inputFocused(e)) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        // Redo
        window.__actionsForMenu.redo();
      } else {
        // Undo
        window.__actionsForMenu.undo();
      }
    }
  }
});
