import { app, Menu, BrowserWindow, BaseWindow, session } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows'
import { initDatabase } from './services/database.service'
import { ProjectService } from './services/project.service'
import { SettingsService } from './services/settings.service'
import { registerAllHandlers } from './ipc/handlers'

function menuSend(win: BaseWindow | undefined, channel: string): void {
  if (win instanceof BrowserWindow) win.webContents.send(channel)
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Mandate',
          accelerator: 'CmdOrCtrl+N',
          click: (_item, win) => menuSend(win, 'menu:new-mandate'),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: (_item, win) => menuSend(win, 'menu:save'),
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: (_item, win) => menuSend(win, 'menu:preferences'),
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: (_item, win) => menuSend(win, 'menu:toggle-sidebar'),
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(process.env.NODE_ENV === 'development'
          ? [{ type: 'separator' as const }, { role: 'toggleDevTools' as const }]
          : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Master Mandate Creator',
          click: (_item, win) => menuSend(win, 'menu:about'),
        },
      ],
    },
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function setupCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none';",
        ],
      },
    })
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.hpx.mandate-creator')

  // Optimize shortcuts in dev
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupCSP()

  const { repo, engine } = initDatabase()
  console.warn(`[App] Storage engine: ${engine}`)

  const projectService = new ProjectService(repo)
  const settingsService = new SettingsService(repo)
  registerAllHandlers(projectService, settingsService)

  buildMenu()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
