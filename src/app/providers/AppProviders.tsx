import { PropsWithChildren } from 'react'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { Provider as ReduxProvider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { store } from '@/store/store'
import { AuthProvider } from '@/features/auth/AuthProvider'

const colorSchemeManager = localStorageColorSchemeManager({ key: 'fishdvizh-color-scheme' })
const queryClient = new QueryClient()

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
          <ModalsProvider modalProps={{ zIndex: 10000, overlayProps: { opacity: 0.55, blur: 2 } }}>
            <Notifications position="top-right" />
            <AuthProvider>
              {children}
            </AuthProvider>
          </ModalsProvider>
        </MantineProvider>
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </QueryClientProvider>
    </ReduxProvider>
  )
}


