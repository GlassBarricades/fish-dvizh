import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../../store/store'
import { setSession, startInitializing } from './authSlice'
import { supabase } from '../../lib/supabaseClient'

type Props = { children: React.ReactNode }

export function AuthProvider({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    let isMounted = true
    dispatch(startInitializing())
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      dispatch(setSession({ session: data.session, user: data.session?.user ?? null }))
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setSession({ session, user: session?.user ?? null }))
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [dispatch])

  return children
}


