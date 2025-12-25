const { app, BrowserWindow, ipcMain } = require('electron'); // Agregado ipcMain
const path = require('path');
const isDev = require('electron-is-dev');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let mainWindow;
let port;
const PUERTO_COM = 'COM3'; // <--- ¡VERIFICA QUE ESTE SEA TU PUERTO!

function setupSerial() {
  // Configuramos el puerto USB
  port = new SerialPort({ path: PUERTO_COM, baudRate: 115200 }, function (err) {
    if (err) {
      return console.log('❌ Error abriendo puerto: ', err.message);
    }
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  parser.on('data', (line) => {
    try {
      console.log('📡 Dato recibido:', line);
      const jsonData = JSON.parse(line);
      
      // Enviar a la ventana de React
      if (mainWindow) {
        mainWindow.webContents.send('dato-serial', jsonData);
      }
    } catch (e) {
      console.error('Error parseando JSON:', e);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Usamos path.resolve para evitar problemas de rutas relativas
      preload: path.resolve(__dirname, 'preload.js'), 
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  setupSerial(); // Iniciar puerto USB al arrancar
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});