const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  iniciarEscaneo: () => ipcRenderer.send('iniciar-escaneo'),
  detenerEscaneo: () => ipcRenderer.send('detener-escaneo'),
  
  // --- CORRECCIÓN AQUÍ ---
  onDatoSerial: (callback) => {
    // 1. Definimos la función que recibe el dato
    const subscription = (_event, value) => callback(value);
    
    // 2. Le decimos a Electron que escuche
    ipcRenderer.on('dato-serial', subscription);

    // 3. ¡IMPORTANTE! Retornamos una función para dejar de escuchar (Limpieza)
    return () => {
      ipcRenderer.removeListener('dato-serial', subscription);
    };
  }
});