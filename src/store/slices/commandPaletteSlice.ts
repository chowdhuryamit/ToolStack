import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type CommandPaletteState = {
  isOpen: boolean
  query: string
}

const initialState: CommandPaletteState = {
  isOpen: false,
  query: '',
}

const commandPaletteSlice = createSlice({
  name: 'commandPalette',
  initialState,
  reducers: {
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload
    },
    setCommandPaletteQuery(state, action: PayloadAction<string>) {
      state.query = action.payload
    },
  },
})

export const { setCommandPaletteOpen, setCommandPaletteQuery } = commandPaletteSlice.actions
export default commandPaletteSlice.reducer
