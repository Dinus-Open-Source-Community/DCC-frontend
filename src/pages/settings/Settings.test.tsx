import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import Settings from './Settings';

// Mock axios instance to prevent actual API calls
vi.mock('axios', () => {
  const getMock = vi.fn();
  return {
    default: {
      create: () => ({
        get: getMock,
      }),
    },
  };
});

// Extract the mocked get function for manipulation in tests
const mockGet = vi.mocked(axios.create().get);

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Settings page correctly', () => {
    mockGet.mockResolvedValueOnce({ data: { authenticated: true } });
    render(<Settings />);
    
    // Verify static UI elements
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Framework Version')).toBeInTheDocument();
    expect(screen.getByText('React 19.0.0')).toBeInTheDocument();
  });

  it('displays ONLINE status when backend authentication is valid', async () => {
    // Mock a successful authentication response
    mockGet.mockResolvedValueOnce({ data: { authenticated: true } });
    
    render(<Settings />);
    
    // Initially it should show CHECKING...
    expect(screen.getByText('CHECKING...')).toBeInTheDocument();
    
    // Wait for the async API call to resolve and UI to update
    await waitFor(() => {
      expect(screen.getByText('ONLINE')).toBeInTheDocument();
    });
    
    // Ensure CHECKING... is no longer present
    expect(screen.queryByText('CHECKING...')).not.toBeInTheDocument();
  });

  it('displays OFFLINE status when backend authentication is invalid', async () => {
    // Mock an invalid authentication response
    mockGet.mockResolvedValueOnce({ data: { authenticated: false } });
    
    render(<Settings />);
    
    // Wait for the UI to update to offline state
    await waitFor(() => {
      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    });
  });

  it('displays OFFLINE status when API request fails', async () => {
    // Mock a network error
    mockGet.mockRejectedValueOnce(new Error('Network Error'));
    
    render(<Settings />);
    
    // Wait for the UI to update to offline state
    await waitFor(() => {
      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    });
  });
});
