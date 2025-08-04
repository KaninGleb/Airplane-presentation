import { createContext } from 'react'

type LoadingContextType = {
  isLoading: boolean
  setIsLoading: (value: boolean) => void
}

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined)
