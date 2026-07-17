import { combineReducers } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import commandPaletteReducer from './slices/commandPaletteSlice'
import editorReducer from './slices/editorSlice'
import notificationReducer from './slices/notificationSlice'
import sidebarReducer from './slices/sidebarSlice'
import themeReducer from './slices/themeSlice'

export const rootReducer = combineReducers({
  app: appReducer,
  commandPalette: commandPaletteReducer,
  editor: editorReducer,
  notifications: notificationReducer,
  sidebar: sidebarReducer,
  theme: themeReducer,
})
