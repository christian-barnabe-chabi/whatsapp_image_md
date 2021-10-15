const { app, BrowserWindow } = require('electron');
const { server } = require('./app');
const { port } = require('./bin/www');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile("http://localhost:3000");
}

app.whenReady().then(() => {
  server.listen(port);
  createWindow()
})