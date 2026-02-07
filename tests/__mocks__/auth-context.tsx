import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthContext } from '../../src/context/auth-context'
import { User, Session } from '@supabase/supabase-js'
import { vi } from 'vitest'

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
} as User

const mockAuthValue = {
  user: mockUser,
  session: {} as Session,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: () => true,
  getProfile: vi.fn(),
}

const renderWithAuth = (
  ui: ReactElement,
  authOverrides = {},
  options?: RenderOptions
) => {
  return render(
    <AuthContext.Provider value={{ ...mockAuthValue, ...authOverrides }}>
      {ui}
    </AuthContext.Provider>,
    options
  )
}

export { renderWithAuth }