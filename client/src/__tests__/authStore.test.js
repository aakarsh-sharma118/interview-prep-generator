/**
 * Unit Tests for Auth Store (Vitest)
 * Author: Aakarsh Sharma
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../hooks/useAuthStore.js';
import { apiClient } from '../api/apiClient.js';
import { ApiUrls } from '../api/apiUrls.js';

// Mock apiClient
vi.mock('../api/apiClient.js', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('initializes with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('handles successful login', async () => {
    const mockUser = { id: 'u1', name: 'Test User', email: 'test@example.com' };
    apiClient.post.mockResolvedValueOnce({
      success: true,
      data: { token: 'mock-jwt-token', user: mockUser },
    });

    const result = await useAuthStore.getState().login('test@example.com', 'secret123');
    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('mock-jwt-token');
  });

  it('handles failed login', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));

    const result = await useAuthStore.getState().login('wrong@example.com', 'wrongpass');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });

  it('runs demoLogin cleanly by falling back to register if login fails', async () => {
    // First login fails, register succeeds
    apiClient.post
      .mockRejectedValueOnce(new Error('User not found'))
      .mockResolvedValueOnce({
        success: true,
        data: {
          token: 'demo-token',
          user: { id: 'demo-id', name: 'Demo User', email: 'demo@interviewprep.dev' },
        },
      });

    const result = await useAuthStore.getState().demoLogin();
    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('demo@interviewprep.dev');
  });

  it('clears state on logout', () => {
    useAuthStore.setState({
      user: { name: 'Demo' },
      token: 'some-token',
      isAuthenticated: true,
    });

    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
