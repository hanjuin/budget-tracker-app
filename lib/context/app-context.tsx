'use client'

import { createContext, useContext } from 'react'

interface AppContextValue {
  userId: string
  displayName: string
}

const AppContext = createContext<AppContextValue>({ userId: '', displayName: 'HJ' })

export function AppContextProvider({
  children,
  userId,
  displayName,
}: {
  children: React.ReactNode
  userId: string
  displayName: string
}) {
  return <AppContext.Provider value={{ userId, displayName }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  return useContext(AppContext)
}
