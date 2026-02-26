// tests/__mocks__/auth-context.tsx
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthContext } from '../../src/context/auth-context'
import { User, Session } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { UserRole } from '../../src/types/user'

// Mock user generator based on role
const createMockUser = (role: UserRole = 'user'): User => ({
  id: `user-${role}-1`,
  email: `${role}@example.com`,
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: { role },
  user_metadata: {
    name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
  },
} as User)

// Default mock user
const defaultMockUser = createMockUser('user')

// Mock session generator
const createMockSession = (user: User): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user,
} as Session)

// Mock functions
const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockGetProfile = vi.fn()
const mockSignUp = vi.fn()

// Base mock auth value
const baseMockAuthValue = {
  user: defaultMockUser,
  session: createMockSession(defaultMockUser),
  loading: false,
  role: 'user' as UserRole,
  login: mockLogin,
  logout: mockLogout,
  signUp: mockSignUp,
  isAuthenticated: () => true,
  getProfile: mockGetProfile,
}

/**
 * Render component with mocked auth context for a specific role
 */
const renderWithAuth = (
  ui: ReactElement,
  authOverrides: Partial<typeof baseMockAuthValue> = {},
  options?: RenderOptions
) => {
  const mockAuthValue = {
    ...baseMockAuthValue,
    ...authOverrides,
  }

  return render(
    <AuthContext.Provider value={mockAuthValue}>
      {ui}
    </AuthContext.Provider>,
    options
  )
}

/**
 * Render component with auth context for a specific user role
 * @param ui - React component to render
 * @param role - User role (admin, user, manager, etc.)
 * @param overrides - Additional auth context overrides
 * @param options - Render options
 */
export const renderWithRole = (
  ui: ReactElement,
  role: UserRole = 'user',
  overrides: Partial<typeof baseMockAuthValue> = {},
  options?: RenderOptions
) => {
  const user = createMockUser(role)
  const session = createMockSession(user)
  
  return renderWithAuth(
    ui,
    {
      user,
      session,
      role,
      isAuthenticated: () => true,
      ...overrides,
    },
    options
  )
}

/**
 * Render component with unauthenticated user
 */
export const renderUnauthenticated = (
  ui: ReactElement,
  overrides: Partial<typeof baseMockAuthValue> = {},
  options?: RenderOptions
) => {
  return renderWithAuth(
    ui,
    {
      user: null,
      session: null,
      role: 'guest' as UserRole,
      isAuthenticated: () => false,
      ...overrides,
    },
    options
  )
}

/**
 * Render component with loading state
 */
export const renderLoadingAuth = (
  ui: ReactElement,
  overrides: Partial<typeof baseMockAuthValue> = {},
  options?: RenderOptions
) => {
  return renderWithAuth(
    ui,
    {
      user: null,
      session: null,
      role: 'guest' as UserRole,
      loading: true,
      isAuthenticated: () => false,
      ...overrides,
    },
    options
  )
}

/**
 * Render component with admin role
 */
export const renderAsSuperAdmin = (
  ui: ReactElement,
  overrides: Partial<typeof baseMockAuthValue> = {},
  options?: RenderOptions
) => {
  return renderWithRole(ui, 'superadmin', overrides, options)
}

/**
 * Render component with user role
 */
export const renderAsUser = (
  ui: ReactElement,
  overrides: Partial<typeof baseMockAuthValue> = {},
  options?: RenderOptions
) => {
  return renderWithRole(ui, 'user', overrides, options)
}

/**
 * Reset all mock functions
 */
export const resetAuthMocks = () => {
  mockLogin.mockClear()
  mockLogout.mockClear()
  mockGetProfile.mockClear()
  mockSignUp.mockClear()
}

// Export mock functions for assertions in tests
export const authMocks = {
  login: mockLogin,
  logout: mockLogout,
  getProfile: mockGetProfile,
  signUp: mockSignUp,
}

export { renderWithAuth }