import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type EditorState = {
  fontSize: number
  wordWrap: boolean
  minimap: boolean
}

const initialState: EditorState = {
  fontSize: 14,
  wordWrap: true,
  minimap: false,
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setEditorFontSize(state, action: PayloadAction<number>) {
      state.fontSize = action.payload
    },
    setEditorWordWrap(state, action: PayloadAction<boolean>) {
      state.wordWrap = action.payload
    },
    setEditorMinimap(state, action: PayloadAction<boolean>) {
      state.minimap = action.payload
    },
  },
})

export const { setEditorFontSize, setEditorMinimap, setEditorWordWrap } = editorSlice.actions
export default editorSlice.reducer
