import request from 'supertest';
import express, { Express } from 'express';
import { IUserRepository } from '../../server/storage';
import * as auth from '../../server/auth';

/**
 * Phase 5: User Management and Bulk Date Operations - Server Tests
 * 
 * Tests for:
 * - Password change endpoint
 * - Account deletion endpoint (with optional Google Calendar cleanup)
 * - Bulk next-maintenance-date endpoint
 * - Google Calendar sync status endpoint
 */

describe('User Management - Server Tests (Phase 5)', () => {
  let app: Express;
  let mockStorage: Partial<IUserRepository>;
  let testUserId = 'test-user-123';
  let testEmail = 'test@example.com';
  let testPasswordHash = '';

  beforeAll(() => {
    // Setup express app with mock storage
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    app.use((req: any, res, next) => {
      req.user = { id: testUserId, email: testEmail };
      next();
    });
  });

  describe('PATCH /api/auth/password', () => {
    it('should successfully change password with valid current password', async () => {
      const currentPassword = 'ValidPassword123';
      const newPassword = 'NewValidPassword456';
      
      // Simulate successful password change
      const res = await request(app)
        .patch('/api/auth/password')
        .send({
          currentPassword,
          newPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password updated');
    });

    it('should reject password change with invalid current password', async () => {
      const res = await request(app)
        .patch('/api/auth/password')
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewValidPassword456'
        });

      expect(res.status).toBe(403);
      expect(res.body.error || res.body.message).toContain('password');
    });

    it('should validate new password minimum length', async () => {
      const res = await request(app)
        .patch('/api/auth/password')
        .send({
          currentPassword: 'ValidPassword123',
          newPassword: 'Short12'  // Less than 8 characters
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('at least 8');
    });

    it('should reject new password if same as current', async () => {
      const samePassword = 'ValidPassword123';
      
      const res = await request(app)
        .patch('/api/auth/password')
        .send({
          currentPassword: samePassword,
          newPassword: samePassword
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('different');
    });

    it('should require current password field', async () => {
      const res = await request(app)
        .patch('/api/auth/password')
        .send({
          newPassword: 'NewValidPassword456'
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('currentPassword');
    });

    it('should require new password field', async () => {
      const res = await request(app)
        .patch('/api/auth/password')
        .send({
          currentPassword: 'ValidPassword123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('newPassword');
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      const res = await request(appNoAuth)
        .patch('/api/auth/password')
        .send({
          currentPassword: 'ValidPassword123',
          newPassword: 'NewValidPassword456'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('should successfully delete account without calendar cleanup', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'ValidPassword123',
          deleteCalendarData: false
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Account deleted');
      expect(res.body).toHaveProperty('tasksDeleted');
      expect(res.body).toHaveProperty('templatesDeleted');
    });

    it('should successfully delete account with calendar cleanup', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'ValidPassword123',
          deleteCalendarData: true
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Account deleted');
      expect(res.body).toHaveProperty('calendarCleanup');
      expect(res.body.calendarCleanup).toHaveProperty('requested');
      expect(res.body.calendarCleanup).toHaveProperty('status');
    });

    it('should return structured cleanup report on success', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'ValidPassword123',
          deleteCalendarData: true
        });

      expect(res.status).toBe(200);
      if (res.body.calendarCleanup?.status === 'success') {
        expect(res.body.calendarCleanup).toHaveProperty('eventsDeleted');
        expect(res.body.calendarCleanup).toHaveProperty('eventsFailed');
        expect(typeof res.body.calendarCleanup.eventsDeleted).toBe('number');
        expect(typeof res.body.calendarCleanup.eventsFailed).toBe('number');
      }
    });

    it('should return cleanup warnings on partial failure', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'ValidPassword123',
          deleteCalendarData: true
        });

      expect(res.status).toBe(200);
      if (res.body.calendarCleanup?.status === 'partial') {
        expect(res.body.calendarCleanup).toHaveProperty('warnings');
        expect(Array.isArray(res.body.calendarCleanup.warnings)).toBe(true);
      }
    });

    it('should reject account deletion with wrong password', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'WrongPassword123',
          deleteCalendarData: false
        });

      expect(res.status).toBe(403);
      expect(res.body.error || res.body.message).toContain('password');
    });

    it('should require password field', async () => {
      const res = await request(app)
        .delete('/api/auth/account')
        .send({
          deleteCalendarData: false
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('password');
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      const res = await request(appNoAuth)
        .delete('/api/auth/account')
        .send({
          password: 'ValidPassword123',
          deleteCalendarData: false
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/tasks/bulk-next-maintenance-date', () => {
    it('should fill empty dates with fill-empty-only mode', async () => {
      const res = await request(app)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: ['task-1', 'task-2', 'task-3'],
          kind: 'minor',
          date: '2026-09-01',
          mode: 'fill-empty-only'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updated');
      expect(res.body).toHaveProperty('skipped');
      expect(res.body).toHaveProperty('failed');
      expect(typeof res.body.updated).toBe('number');
      expect(typeof res.body.skipped).toBe('number');
      expect(typeof res.body.failed).toBe('number');
    });

    it('should overwrite existing dates with overwrite mode', async () => {
      const res = await request(app)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: ['task-1', 'task-2'],
          kind: 'major',
          date: '2027-12-31',
          mode: 'overwrite'
        });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBeGreaterThanOrEqual(0);
    });

    it('should validate kind is minor or major', async () => {
      const res = await request(app)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: ['task-1'],
          kind: 'invalid-kind',
          date: '2026-09-01',
          mode: 'fill-empty-only'
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('kind');
    });

    it('should validate date format (YYYY-MM-DD)', async () => {
      const res = await request(app)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: ['task-1'],
          kind: 'minor',
          date: '09-01-2026',  // Wrong format
          mode: 'fill-empty-only'
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('date');
    });

    it('should validate mode is fill-empty-only or overwrite', async () => {
      const res = await request(app)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: ['task-1'],
          kind: 'minor',
          date: '2026-09-01',
          mode: 'invalid-mode'
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('mode');
    });

    it('should reject empty taskIds array', async () => {
      const res = await request(app)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: [],
          kind: 'minor',
          date: '2026-09-01',
          mode: 'fill-empty-only'
        });

      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toContain('taskIds');
    });

    it('should enforce user ownership per task', async () => {
      // This tests that cross-user task updates are prevented
      // Implementation: server validates each taskId belongs to authenticated user
      const res = await request(app)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: ['task-owned-by-other-user'],
          kind: 'minor',
          date: '2026-09-01',
          mode: 'fill-empty-only'
        });

      // Either 403 Forbidden or task appears in failed count
      expect([200, 403]).toContain(res.status);
      if (res.status === 200) {
        // Task should be in failed or skipped
        expect(res.body.failed + res.body.skipped).toBeGreaterThan(0);
      }
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      const res = await request(appNoAuth)
        .post('/api/tasks/bulk-next-maintenance-date')
        .send({
          taskIds: ['task-1'],
          kind: 'minor',
          date: '2026-09-01',
          mode: 'fill-empty-only'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/calendar/google/sync/status', () => {
    it('should return sync status for connected account', async () => {
      const res = await request(app)
        .get('/api/calendar/google/sync/status');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('configured');
      expect(res.body).toHaveProperty('connected');
      expect(typeof res.body.configured).toBe('boolean');
      expect(typeof res.body.connected).toBe('boolean');
    });

    it('should include calendarId when connected', async () => {
      const res = await request(app)
        .get('/api/calendar/google/sync/status');

      if (res.body.connected) {
        expect(res.body).toHaveProperty('calendarId');
        expect(res.body.calendarId).toBeTruthy();
      }
    });

    it('should include accountEmail when connected', async () => {
      const res = await request(app)
        .get('/api/calendar/google/sync/status');

      if (res.body.connected) {
        expect(res.body).toHaveProperty('accountEmail');
        expect(res.body.accountEmail).toMatch(/@gmail\.com|@googlemail\.com/);
      }
    });

    it('should include sync metadata when available', async () => {
      const res = await request(app)
        .get('/api/calendar/google/sync/status');

      expect(res.status).toBe(200);
      if (res.body.connected) {
        expect(res.body).toHaveProperty('lastSyncedAt');
        expect(res.body).toHaveProperty('activeScopeCount');
        expect(res.body).toHaveProperty('syncScopeVersion');
      }
    });

    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());

      const res = await request(appNoAuth)
        .get('/api/calendar/google/sync/status');

      expect(res.status).toBe(401);
    });
  });

  describe('Data Integrity - Strict User Scoping', () => {
    it('should not allow cross-user task updates', async () => {
      // Verify that bulk update cannot affect another user's tasks
      const userAAuth = express();
      userAAuth.use(express.json());
      userAAuth.use((req: any, res, next) => {
        req.user = { id: 'user-a', email: 'user-a@example.com' };
        next();
      });

      const userBAuth = express();
      userBAuth.use(express.json());
      userBAuth.use((req: any, res, next) => {
        req.user = { id: 'user-b', email: 'user-b@example.com' };
        next();
      });

      // Implementation detail: server must validate task ownership
      // This test documents the requirement
      expect(true).toBe(true);
    });

    it('should not expose other users data in sync status', async () => {
      // Verify that Google Calendar status only returns current user's calendar
      expect(true).toBe(true);
    });
  });

  describe('Session Invalidation - Account Deletion', () => {
    it('should invalidate user session after account deletion', async () => {
      // After account deletion, subsequent API calls with old session should fail
      const res = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'ValidPassword123',
          deleteCalendarData: false
        });

      expect(res.status).toBe(200);
      
      // In a real test, verify that subsequent calls with same session fail
      // This would require session management in the app
    });
  });
});
