import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export type NotificationKind = 'info' | 'success' | 'warning' | 'error'

export type AppNotification = {
  id: string
  kind: NotificationKind
  message: string
}

type NotificationState = {
  items: AppNotification[]
}

const initialState: NotificationState = {
  items: [],
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: {
      reducer(state, action: PayloadAction<AppNotification>) {
        state.items.push(action.payload)
      },
      prepare(message: string, kind: NotificationKind = 'info') {
        return { payload: { id: nanoid(), kind, message } }
      },
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
  },
})

export const { addNotification, removeNotification } = notificationSlice.actions
export default notificationSlice.reducer
