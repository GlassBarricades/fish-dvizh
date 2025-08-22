import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Training } from '../types'
import type { TrainingCatch, TrainingEvent, TrainingTakenUserBait } from '../api'

// Типы для контекста
export interface CurrentRig {
  bait: TrainingTakenUserBait | null
  weight: number
  notes: string
}

export interface TrainingState {
  training: Training | null
  currentRig: CurrentRig | null
  catches: TrainingCatch[]
  events: TrainingEvent[]
  takenBaits: TrainingTakenUserBait[]
  isLoading: boolean
  error: string | null
}

// Действия для reducer
export type TrainingAction =
  | { type: 'SET_TRAINING'; payload: Training }
  | { type: 'SET_CATCHES'; payload: TrainingCatch[] }
  | { type: 'SET_EVENTS'; payload: TrainingEvent[] }
  | { type: 'SET_TAKEN_BAITS'; payload: TrainingTakenUserBait[] }
  | { type: 'UPDATE_CURRENT_RIG'; payload: Partial<CurrentRig> }
  | { type: 'ADD_CATCH'; payload: TrainingCatch }
  | { type: 'UPDATE_CATCH'; payload: TrainingCatch }
  | { type: 'DELETE_CATCH'; payload: string }
  | { type: 'ADD_EVENT'; payload: TrainingEvent }
  | { type: 'UPDATE_EVENT'; payload: TrainingEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

// Начальное состояние
const initialState: TrainingState = {
  training: null,
  currentRig: null,
  catches: [],
  events: [],
  takenBaits: [],
  isLoading: false,
  error: null
}

// Reducer для управления состоянием
function trainingReducer(state: TrainingState, action: TrainingAction): TrainingState {
  switch (action.type) {
    case 'SET_TRAINING':
      return { ...state, training: action.payload }
    
    case 'SET_CATCHES':
      return { ...state, catches: action.payload }
    
    case 'SET_EVENTS':
      return { ...state, events: action.payload }
    
    case 'SET_TAKEN_BAITS':
      return { ...state, takenBaits: action.payload }
    
    case 'UPDATE_CURRENT_RIG':
      return {
        ...state,
        currentRig: state.currentRig
          ? { ...state.currentRig, ...action.payload }
          : { bait: null, weight: 0, notes: '', ...action.payload }
      }
    
    case 'ADD_CATCH':
      return { ...state, catches: [action.payload, ...state.catches] }
    
    case 'UPDATE_CATCH':
      return {
        ...state,
        catches: state.catches.map(c => c.id === action.payload.id ? action.payload : c)
      }
    
    case 'DELETE_CATCH':
      return {
        ...state,
        catches: state.catches.filter(c => c.id !== action.payload)
      }
    
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] }
    
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e)
      }
    
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload)
      }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

// Интерфейс контекста
interface TrainingContextType {
  state: TrainingState
  dispatch: React.Dispatch<TrainingAction>
  
  // Удобные методы для работы с состоянием
  updateCurrentRig: (rig: Partial<CurrentRig>) => void
  addCatch: (catch_: TrainingCatch) => void
  updateCatch: (catch_: TrainingCatch) => void
  deleteCatch: (id: string) => void
  addEvent: (event: TrainingEvent) => void
  updateEvent: (event: TrainingEvent) => void
  deleteEvent: (id: string) => void
  
  // Вычисляемые значения
  trainingUsers: Array<{ id: string; name: string }>
  lastUserBait: string
  activeTask: any | null
}

// Создание контекста
const TrainingContext = createContext<TrainingContextType | null>(null)

// Провайдер контекста
interface TrainingProviderProps {
  children: ReactNode
  trainingId?: string
}

export function TrainingProvider({ children }: TrainingProviderProps) {
  const [state, dispatch] = useReducer(trainingReducer, initialState)

  // Удобные методы
  const updateCurrentRig = useCallback((rig: Partial<CurrentRig>) => {
    dispatch({ type: 'UPDATE_CURRENT_RIG', payload: rig })
    
    // Сохраняем в localStorage
    try {
      const current = state.currentRig || { bait: null, weight: 0, notes: '' }
      const updated = { ...current, ...rig }
      localStorage.setItem('current-rig', JSON.stringify({
        baitId: updated.bait?.user_bait_id || null,
        weight: updated.weight,
        notes: updated.notes
      }))
    } catch {
      // Игнорируем ошибки localStorage
    }
  }, [state.currentRig])

  const addCatch = useCallback((catch_: TrainingCatch) => {
    dispatch({ type: 'ADD_CATCH', payload: catch_ })
  }, [])

  const updateCatch = useCallback((catch_: TrainingCatch) => {
    dispatch({ type: 'UPDATE_CATCH', payload: catch_ })
  }, [])

  const deleteCatch = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CATCH', payload: id })
  }, [])

  const addEvent = useCallback((event: TrainingEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event })
  }, [])

  const updateEvent = useCallback((event: TrainingEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event })
  }, [])

  const deleteEvent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id })
  }, [])

  // Вычисляемые значения
  const trainingUsers = useMemo(() => {
    const userIds = new Set<string>()
    const userMap = new Map<string, string>()
    
    // Собираем пользователей из поимок
    state.catches.forEach(catch_ => {
      if (catch_.user_id && !userIds.has(catch_.user_id)) {
        userIds.add(catch_.user_id)
        const userData = (catch_ as any).users
        let userName = `Пользователь ${catch_.user_id.slice(0, 8)}`
        if (userData?.raw_user_meta_data?.nickname) {
          userName = userData.raw_user_meta_data.nickname
        } else if (userData?.email) {
          userName = userData.email
        }
        userMap.set(catch_.user_id, userName)
      }
    })
    
    // Собираем пользователей из событий
    state.events.forEach(event => {
      if (event.user_id && !userIds.has(event.user_id)) {
        userIds.add(event.user_id)
        const userData = (event as any).users
        let userName = `Пользователь ${event.user_id.slice(0, 8)}`
        if (userData?.raw_user_meta_data?.nickname) {
          userName = userData.raw_user_meta_data.nickname
        } else if (userData?.email) {
          userName = userData.email
        }
        userMap.set(event.user_id, userName)
      }
    })
    
    return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }))
  }, [state.catches, state.events])

  const lastUserBait = useMemo(() => {
    // Логика для определения последней приманки пользователя
    // Пока возвращаем пустую строку, будет реализовано позже
    return ''
  }, [state.catches])

  const activeTask = useMemo(() => {
    // Логика для определения активной задачи
    // Пока возвращаем null, будет реализовано позже
    return null
  }, [])

  const contextValue: TrainingContextType = {
    state,
    dispatch,
    updateCurrentRig,
    addCatch,
    updateCatch,
    deleteCatch,
    addEvent,
    updateEvent,
    deleteEvent,
    trainingUsers,
    lastUserBait,
    activeTask
  }

  return (
    <TrainingContext.Provider value={contextValue}>
      {children}
    </TrainingContext.Provider>
  )
}

// Хук для использования контекста
export function useTrainingContext() {
  const context = useContext(TrainingContext)
  if (!context) {
    throw new Error('useTrainingContext must be used within TrainingProvider')
  }
  return context
}

// Хук для использования только состояния
export function useTrainingState() {
  const { state } = useTrainingContext()
  return state
}

// Хук для использования только действий
export function useTrainingActions() {
  const { updateCurrentRig, addCatch, updateCatch, deleteCatch, addEvent, updateEvent, deleteEvent } = useTrainingContext()
  return { updateCurrentRig, addCatch, updateCatch, deleteCatch, addEvent, updateEvent, deleteEvent }
}
