import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type SidebarState = {
  collapsed: boolean
  selectedCategory: string
}

const initialState: SidebarState = {
  collapsed: false,
  selectedCategory: 'dashboard',
}

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.collapsed = action.payload
    },
    toggleSidebar(state) {
      state.collapsed = !state.collapsed
    },
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload
    },
  },
})

export const { setSelectedCategory, setSidebarCollapsed, toggleSidebar } = sidebarSlice.actions
export default sidebarSlice.reducer
