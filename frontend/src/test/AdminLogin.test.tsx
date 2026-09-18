import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './utils';
import { AdminLogin } from '@components/admin/AdminLogin';
import * as api from '@services/api';
import type { LoginResponse } from '@types';

vi.mock('@services/api', async () => {
  const actual = await vi.importActual<typeof import('@services/api')>('@services/api');
  return {
    ...actual,
    loginAdmin: vi.fn(),
  };
});

describe('AdminLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a validation error when submitted with empty password', async () => {
    renderWithProviders(<AdminLogin onSuccess={vi.fn()} />);

    // Default username is "admin", but password is empty
    const submitBtn = screen.getByRole('button', { name: /authenticate operator/i });
    fireEvent.click(submitBtn);

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert.textContent).toContain('Password is required.');
  });

  it('shows a validation error when submitted with empty username', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminLogin onSuccess={vi.fn()} />);

    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);

    const submitBtn = screen.getByRole('button', { name: /authenticate operator/i });
    await user.click(submitBtn);

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert.textContent).toContain('Username is required.');
  });

  it('calls the login API on submit with valid credentials and invokes onSuccess', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const mockAuthResponse: LoginResponse = {
      token: 'jwt-valid-token-12345',
      tokenType: 'Bearer',
      expiresIn: 7200,
      username: 'admin',
      role: 'ROLE_ADMIN',
    };

    vi.mocked(api.loginAdmin).mockResolvedValue(mockAuthResponse);

    renderWithProviders(<AdminLogin onSuccess={handleSuccess} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /authenticate operator/i });

    await user.clear(usernameInput);
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin123');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.loginAdmin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      });
    });

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith(mockAuthResponse);
    });
  });

  it('displays error banner when the login API rejects credentials', async () => {
    const user = userEvent.setup();
    vi.mocked(api.loginAdmin).mockRejectedValue({
      response: {
        data: {
          detail: 'Bad credentials',
        },
      },
    });

    renderWithProviders(<AdminLogin onSuccess={vi.fn()} />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /authenticate operator/i });

    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitBtn);

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert.textContent).toContain('Bad credentials');
  });
});
