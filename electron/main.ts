import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import { registerIpcHandlers } from './ipc-handlers'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 日志写到 exe 所在目录（方便排查问题）
const isDev = !!process.env.VITE_DEV_SERVER_URL
function getLogDir() {
  try {
    return path.dirname(app.getPath('exe'))
  } catch {
    return isDev ? __dirname : path.join(__dirname, '..')
  }
}
const logFile = path.join(getLogDir(), 'output.log')
function log(msg: string) {
  try { fs.appendFileSync(logFile, new Date().toISOString().slice(11, 19) + ' ' + msg + '\n') } catch {}
}

log('=== APP STARTED ===')

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload.cjs')
  log('preload=' + preloadPath + ' exists=' + fs.existsSync(preloadPath))

  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 640,
    minHeight: 560,
    title: 'SLG 文本翻译工具',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const indexPath = path.join(__dirname, '../dist/index.html')
  log('index exists=' + fs.existsSync(indexPath))

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(() => {
  log('App ready')
  registerIpcHandlers()
  log('IPC handlers registered')
  createWindow()
  log('Window created')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
