import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type InitializationState = 'idle' | 'initializing' | 'ready' | 'error'

type GlobalPreferences = {
  reduceMotion: boolean
  compactMode: boolean
}

type AppState = {
  isOnline: boolean
  initializationState: InitializationState
  globalPreferences: GlobalPreferences
}

const initialState: AppState = {
  isOnline: navigator.onLine,
  initializationState: 'ready',
  globalPreferences: {
    reduceMotion: false,
    compactMode: false,
  },
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload
    },
    setInitializationState(state, action: PayloadAction<InitializationState>) {
      state.initializationState = action.payload
    },
    setGlobalPreferences(state, action: PayloadAction<Partial<GlobalPreferences>>) {
      state.globalPreferences = { ...state.globalPreferences, ...action.payload }
    },
  },
})

export const { setGlobalPreferences, setInitializationState, setOnlineStatus } = appSlice.actions
export default appSlice.reducer
