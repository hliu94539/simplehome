import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AccountMenu from '../../client/src/components/account-menu';
import BulkFillDatesModal from '../../client/src/components/bulk-fill-dates-modal';
import UserSettingsModal from '../../client/src/components/user-settings-modal';

/**
 * Phase 5: UI Tests for User Management Features
 * 
 * Tests for:
 * - Account menu interactions (logout, change password, delete account)
 * - Bulk fill dates modal workflow
 * - User settings modal with Google Calendar display
 */

describe('Account Menu - UI Tests (Phase 5)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Logout Functionality', () => {
    it('should render account menu with user avatar', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );
      
      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      expect(avatarButton).toBeInTheDocument();
    });

    it('should display logout option in dropdown', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const logoutButton = screen.getByRole('menuitem', { name: /logout/i });
        expect(logoutButton).toBeInTheDocument();
      });
    });

    it('should call logout endpoint and clear auth state on logout click', async () => {
      // Mock API calls
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => null });

      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const logoutButton = screen.getByRole('menuitem', { name: /logout/i });
        fireEvent.click(logoutButton);
      });

      // Verify logout API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.any(Object)
      );
    });
  });

  describe('Change Password Dialog', () => {
    it('should open change password dialog from menu', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const changePasswordOption = screen.getByRole('menuitem', { name: /change.*password/i });
        fireEvent.click(changePasswordOption);
      });

      await waitFor(() => {
        expect(screen.getByText(/change password/i)).toBeInTheDocument();
      });
    });

    it('should display password input fields', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const changePasswordOption = screen.getByRole('menuitem', { name: /change.*password/i });
        fireEvent.click(changePasswordOption);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm.*password/i)).toBeInTheDocument();
      });
    });

    it('should validate password match before submission', async () => {
      const user = userEvent.setup();
      
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const changePasswordOption = screen.getByRole('menuitem', { name: /change.*password/i });
        fireEvent.click(changePasswordOption);
      });

      await waitFor(() => {
        const newPasswordField = screen.getByLabelText(/^new password/i);
        const confirmField = screen.getByLabelText(/confirm.*password/i);
        fireEvent.change(newPasswordField, { target: { value: 'Password123' } });
        fireEvent.change(confirmField, { target: { value: 'DifferentPassword456' } });
      });

      const submitButton = screen.getByRole('button', { name: /change|update/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/password.*match|mismatch|same/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum password length (8 chars)', async () => {
      const user = userEvent.setup();
      
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const changePasswordOption = screen.getByRole('menuitem', { name: /change.*password/i });
        fireEvent.click(changePasswordOption);
      });

      await waitFor(() => {
        const newPasswordField = screen.getByLabelText(/^new password/i);
        fireEvent.change(newPasswordField, { target: { value: 'Short1' } });  // Less than 8
      });

      const submitButton = screen.getByRole('button', { name: /change|update/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/at least 8|minimum/i)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Account Dialog', () => {
    it('should open delete account dialog from menu', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const deleteAccountOption = screen.getByRole('menuitem', { name: /delete.*account|delete account/i });
        fireEvent.click(deleteAccountOption);
      });

      await waitFor(() => {
        expect(screen.getByText(/delete.*account|permanently delete/i)).toBeInTheDocument();
      });
    });

    it('should display password confirmation field', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const deleteAccountOption = screen.getByRole('menuitem', { name: /delete.*account/i });
        fireEvent.click(deleteAccountOption);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it('should display Google Calendar data deletion checkbox', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const deleteAccountOption = screen.getByRole('menuitem', { name: /delete.*account/i });
        fireEvent.click(deleteAccountOption);
      });

      await waitFor(() => {
        const calendarCheckbox = screen.getByRole('checkbox', { name: /delete.*calendar|calendar.*data/i });
        expect(calendarCheckbox).toBeInTheDocument();
      });
    });

    it('should display destructive warning message', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AccountMenu />
        </QueryClientProvider>
      );

      const avatarButton = screen.getByRole('button', { name: /avatar|user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const deleteAccountOption = screen.getByRole('menuitem', { name: /delete.*account/i });
        fireEvent.click(deleteAccountOption);
      });

      await waitFor(() => {
        expect(screen.getByText(/permanent|irreversible|cannot be undone|warning/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Bulk Fill Dates Modal - UI Tests (Phase 5)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Modal Workflow', () => {
    it('should open bulk fill modal when tasks are selected', () => {
      const mockTasks = [
        { id: 'task-1', name: 'Task 1', nextMaintenanceDate: null },
        { id: 'task-2', name: 'Task 2', nextMaintenanceDate: null },
      ];
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1', 'task-2']}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/bulk fill|fill.*dates/i)).toBeInTheDocument();
    });

    it('should display kind selector (minor/major)', () => {
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      expect(screen.getByLabelText(/kind|schedule.*type|minor.*major/i)).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /minor/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /major/i })).toBeInTheDocument();
    });

    it('should display date picker', () => {
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      expect(screen.getByLabelText(/date|next.*date/i)).toBeInTheDocument();
    });

    it('should display month and year selectors for fast navigation', () => {
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      expect(screen.getByLabelText(/month/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    });

    it('should support year range: current ± 10 to ± 30', () => {
      const mockOnClose = jest.fn();
      const currentYear = new Date().getFullYear();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      const yearSelect = screen.getByLabelText(/year/i);
      const options = yearSelect.querySelectorAll('option');
      
      // Extract years from options
      const years = Array.from(options).map(opt => parseInt(opt.value)).filter(y => !isNaN(y));
      
      expect(years[0]).toBeCloseTo(currentYear - 10, 1);
      expect(years[years.length - 1]).toBeCloseTo(currentYear + 30, 1);
    });

    it('should display apply mode selector (fill-empty-only/overwrite)', () => {
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      expect(screen.getByLabelText(/mode|apply|fill-empty|overwrite/i)).toBeInTheDocument();
    });

    it('should disable submit if no date selected', () => {
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      const submitButton = screen.getByRole('button', { name: /fill|apply|submit|confirm/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit after selecting a valid date', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      // Select a date
      const dateInput = screen.getByLabelText(/date|next.*date/i);
      await user.click(dateInput);

      // Pick a calendar day (example: 15th)
      await waitFor(() => {
        const dayButton = screen.getByRole('button', { name: /15/ });
        if (dayButton) fireEvent.click(dayButton);
      });

      const submitButton = screen.getByRole('button', { name: /fill|apply|submit|confirm/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Date Range Validation', () => {
    it('should allow dates up to current year + 30', () => {
      const mockOnClose = jest.fn();
      const farFutureYear = new Date().getFullYear() + 30;

      render(
        <QueryClientProvider client={queryClient}>
          <BulkFillDatesModal
            isOpen={true}
            onClose={mockOnClose}
            selectedTaskIds={['task-1']}
          />
        </QueryClientProvider>
      );

      const yearSelect = screen.getByLabelText(/year/i);
      const futureOption = Array.from(yearSelect.querySelectorAll('option')).find(
        opt => parseInt(opt.value) === farFutureYear
      );

      expect(futureOption).toBeInTheDocument();
    });
  });
});

describe('User Settings Modal - Google Calendar Tests (Phase 5)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Google Calendar Display', () => {
    it('should display Google Calendar section', () => {
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <UserSettingsModal
            isOpen={true}
            onClose={mockOnClose}
            currentTimezone="America/New_York"
            currentName="Test User"
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/google.*calendar|calendar.*id/i)).toBeInTheDocument();
    });

    it('should display calendar ID when connected', async () => {
      const mockOnClose = jest.fn();

      // Mock the sync status query
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          configured: true,
          connected: true,
          calendarId: 'test@gmail.com',
          accountEmail: 'test@gmail.com',
          lastSyncedAt: new Date().toISOString(),
        }),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <UserSettingsModal
            isOpen={true}
            onClose={mockOnClose}
            currentTimezone="America/New_York"
            currentName="Test User"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
      });
    });

    it('should display copy button for calendar ID', async () => {
      const mockOnClose = jest.fn();

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          configured: true,
          connected: true,
          calendarId: 'test@gmail.com',
          accountEmail: 'test@gmail.com',
        }),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <UserSettingsModal
            isOpen={true}
            onClose={mockOnClose}
            currentTimezone="America/New_York"
            currentName="Test User"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /copy.*calendar|calendar.*id/i });
        expect(copyButton).toBeInTheDocument();
      });
    });

    it('should display link to open Google Calendar', async () => {
      const mockOnClose = jest.fn();

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          configured: true,
          connected: true,
          calendarId: 'test@gmail.com',
          accountEmail: 'test@gmail.com',
        }),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <UserSettingsModal
            isOpen={true}
            onClose={mockOnClose}
            currentTimezone="America/New_York"
            currentName="Test User"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const calendarLink = screen.getByRole('link', { name: /open.*google.*calendar|google.*calendar.*settings/i });
        expect(calendarLink).toBeInTheDocument();
        expect(calendarLink).toHaveAttribute('href', 'https://calendar.google.com/calendar/u/0/r');
        expect(calendarLink).toHaveAttribute('target', '_blank');
      });
    });

    it('should show disconnected state when not connected', () => {
      const mockOnClose = jest.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <UserSettingsModal
            isOpen={true}
            onClose={mockOnClose}
            currentTimezone="America/New_York"
            currentName="Test User"
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/not connected|not configured/i)).toBeInTheDocument();
    });
  });
});
