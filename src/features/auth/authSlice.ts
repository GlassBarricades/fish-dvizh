import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Session, User } from '@supabase/supabase-js'

export type AuthState = {
  user: User | null
  session: Session | null
  isInitializing: boolean
}

const initialState: AuthState = {
  user: null,
  session: null,
  isInitializing: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ session: Session | null; user: User | null }>) {
      state.session = action.payload.session
      state.user = action.payload.user
      state.isInitializing = false
    },
    startInitializing(state) {
      state.isInitializing = true
    },
    finishInitializing(state) {
      state.isInitializing = false
    },
  },
})

export const { setSession, startInitializing, finishInitializing } = authSlice.actions
export const authReducer = authSlice.reducer

