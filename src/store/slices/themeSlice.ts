import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ThemeMode = 'light' | 'dark' | 'system'
export type EditorTheme = 'vs-light' | 'vs-dark' | 'hc-black'

type ThemeState = {
  mode: ThemeMode
  editorTheme: EditorTheme
}

const initialState: ThemeState = {
  mode: 'dark',
  editorTheme: 'vs-dark',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload
    },
    setEditorTheme(state, action: PayloadAction<EditorTheme>) {
      state.editorTheme = action.payload
    },
  },
})

export const { setEditorTheme, setThemeMode } = themeSlice.actions
export default themeSlice.reducer
