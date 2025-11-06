/**
 * Electronモジュールのモック
 *
 * ユニットテストでElectronモジュールをモック化
 */

const mockBrowserWindow = {
  loadFile: jest.fn(),
  loadURL: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  webContents: {
    send: jest.fn(),
    on: jest.fn(),
    session: {
      webRequest: {
        onHeadersReceived: jest.fn(),
      },
    },
    setWindowOpenHandler: jest.fn(),
  },
  show: jest.fn(),
  hide: jest.fn(),
  focus: jest.fn(),
  minimize: jest.fn(),
  maximize: jest.fn(),
  close: jest.fn(),
  destroy: jest.fn(),
  isDestroyed: jest.fn(() => false),
  getBounds: jest.fn(() => ({ x: 0, y: 0, width: 1200, height: 800 })),
  setBounds: jest.fn(),
};

const mockApp = {
  on: jest.fn(),
  once: jest.fn(),
  whenReady: jest.fn(() => Promise.resolve()),
  quit: jest.fn(),
  getPath: jest.fn((name) => `/mock/path/${name}`),
  getVersion: jest.fn(() => "1.0.0"),
  getName: jest.fn(() => "IconConverter"),
  setName: jest.fn(),
  isReady: jest.fn(() => true),
  requestSingleInstanceLock: jest.fn(() => true),
};

const mockDialog = {
  showOpenDialog: jest.fn(() =>
    Promise.resolve({ canceled: false, filePaths: ["/mock/file.png"] }),
  ),
  showSaveDialog: jest.fn(() =>
    Promise.resolve({ canceled: false, filePath: "/mock/output.ico" }),
  ),
  showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
  showErrorBox: jest.fn(),
};

const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeHandler: jest.fn(),
  removeAllListeners: jest.fn(),
};

const mockIpcRenderer = {
  invoke: jest.fn(() => Promise.resolve()),
  send: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

const mockTray = jest.fn().mockImplementation(() => ({
  setToolTip: jest.fn(),
  setContextMenu: jest.fn(),
  on: jest.fn(),
  destroy: jest.fn(),
}));

const mockMenu = {
  buildFromTemplate: jest.fn((template) => template),
  setApplicationMenu: jest.fn(),
};

const mockNativeImage = {
  createFromPath: jest.fn(() => ({
    resize: jest.fn(() => ({})),
  })),
  createFromBuffer: jest.fn(() => ({})),
};

const mockContextBridge = {
  exposeInMainWorld: jest.fn(),
};

module.exports = {
  app: mockApp,
  BrowserWindow: jest.fn(() => mockBrowserWindow),
  dialog: mockDialog,
  ipcMain: mockIpcMain,
  ipcRenderer: mockIpcRenderer,
  Tray: mockTray,
  Menu: mockMenu,
  nativeImage: mockNativeImage,
  contextBridge: mockContextBridge,
  // ヘルパー関数
  __resetMocks: () => {
    jest.clearAllMocks();
  },
  __getMockBrowserWindow: () => mockBrowserWindow,
  __getMockApp: () => mockApp,
};
