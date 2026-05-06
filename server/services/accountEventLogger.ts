import { logWithLevel, LogLevel } from './logWithLevel';

/**
 * Structured logging for user account operations
 * Enables observability for Phase 5 rollout verification
 */

export type AccountEventType =
  | 'PASSWORD_CHANGE_INITIATED'
  | 'PASSWORD_CHANGE_SUCCESS'
  | 'PASSWORD_CHANGE_FAILED'
  | 'ACCOUNT_DELETION_INITIATED'
  | 'ACCOUNT_DELETION_SUCCESS'
  | 'ACCOUNT_DELETION_FAILED'
  | 'CALENDAR_CLEANUP_INITIATED'
  | 'CALENDAR_CLEANUP_SUCCESS'
  | 'CALENDAR_CLEANUP_PARTIAL'
  | 'CALENDAR_CLEANUP_FAILED'
  | 'SESSION_INVALIDATION'
  | 'BULK_DATE_FILL_INITIATED'
  | 'BULK_DATE_FILL_SUCCESS'
  | 'BULK_DATE_FILL_FAILED';

export interface StructuredAccountEvent {
  eventType: AccountEventType;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
  errorMessage?: string;
  errorCode?: string;
  duration?: number; // milliseconds
}

export class AccountEventLogger {
  private static formatEvent(event: StructuredAccountEvent): string {
    return JSON.stringify({
      type: 'ACCOUNT_EVENT',
      ...event,
    });
  }

  /**
   * Log password change initiation
   */
  static logPasswordChangeInitiated(userId: string) {
    const event: StructuredAccountEvent = {
      eventType: 'PASSWORD_CHANGE_INITIATED',
      userId,
      timestamp: new Date().toISOString(),
      details: {},
    };
    logWithLevel('INFO', this.formatEvent(event));
  }

  /**
   * Log successful password change
   */
  static logPasswordChangeSuccess(userId: string) {
    const event: StructuredAccountEvent = {
      eventType: 'PASSWORD_CHANGE_SUCCESS',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        action: 'password_hash_updated',
      },
    };
    logWithLevel('INFO', this.formatEvent(event));
  }

  /**
   * Log password change failure
   */
  static logPasswordChangeFailed(
    userId: string,
    reason: string,
    errorCode?: string
  ) {
    const event: StructuredAccountEvent = {
      eventType: 'PASSWORD_CHANGE_FAILED',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        reason,
      },
      errorMessage: reason,
      errorCode,
    };
    logWithLevel('WARN', this.formatEvent(event));
  }

  /**
   * Log account deletion initiation
   */
  static logAccountDeletionInitiated(userId: string, deleteCalendarData: boolean) {
    const event: StructuredAccountEvent = {
      eventType: 'ACCOUNT_DELETION_INITIATED',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        deleteCalendarData,
      },
    };
    logWithLevel('WARN', this.formatEvent(event));
  }

  /**
   * Log successful account deletion
   */
  static logAccountDeletionSuccess(
    userId: string,
    stats: {
      templatesDeleted: number;
      tasksDeleted: number;
      questionnairesDeleted: number;
    }
  ) {
    const event: StructuredAccountEvent = {
      eventType: 'ACCOUNT_DELETION_SUCCESS',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        ...stats,
      },
    };
    logWithLevel('WARN', this.formatEvent(event));
  }

  /**
   * Log account deletion failure
   */
  static logAccountDeletionFailed(userId: string, reason: string, errorCode?: string) {
    const event: StructuredAccountEvent = {
      eventType: 'ACCOUNT_DELETION_FAILED',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        reason,
      },
      errorMessage: reason,
      errorCode,
    };
    logWithLevel('ERROR', this.formatEvent(event));
  }

  /**
   * Log Google Calendar cleanup initiation
   */
  static logCalendarCleanupInitiated(userId: string) {
    const event: StructuredAccountEvent = {
      eventType: 'CALENDAR_CLEANUP_INITIATED',
      userId,
      timestamp: new Date().toISOString(),
      details: {},
    };
    logWithLevel('INFO', this.formatEvent(event));
  }

  /**
   * Log successful Google Calendar cleanup
   */
  static logCalendarCleanupSuccess(
    userId: string,
    stats: {
      eventsDeleted: number;
      eventsFailed: number;
    },
    duration?: number
  ) {
    const event: StructuredAccountEvent = {
      eventType: 'CALENDAR_CLEANUP_SUCCESS',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        ...stats,
      },
      duration,
    };
    logWithLevel('INFO', this.formatEvent(event));
  }

  /**
   * Log partial Google Calendar cleanup (some events failed)
   */
  static logCalendarCleanupPartial(
    userId: string,
    stats: {
      eventsDeleted: number;
      eventsFailed: number;
      warnings: string[];
    },
    duration?: number
  ) {
    const event: StructuredAccountEvent = {
      eventType: 'CALENDAR_CLEANUP_PARTIAL',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        ...stats,
      },
      duration,
    };
    logWithLevel('WARN', this.formatEvent(event));
  }

  /**
   * Log Google Calendar cleanup failure
   */
  static logCalendarCleanupFailed(
    userId: string,
    reason: string,
    errorCode?: string,
    duration?: number
  ) {
    const event: StructuredAccountEvent = {
      eventType: 'CALENDAR_CLEANUP_FAILED',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        reason,
      },
      errorMessage: reason,
      errorCode,
      duration,
    };
    logWithLevel('ERROR', this.formatEvent(event));
  }

  /**
   * Log session invalidation after account deletion
   */
  static logSessionInvalidation(userId: string, sessionId?: string) {
    const event: StructuredAccountEvent = {
      eventType: 'SESSION_INVALIDATION',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        ...(sessionId && { sessionId }),
      },
    };
    logWithLevel('INFO', this.formatEvent(event));
  }

  /**
   * Log bulk date fill initiation
   */
  static logBulkDateFillInitiated(
    userId: string,
    taskCount: number,
    kind: 'minor' | 'major',
    mode: 'fill-empty-only' | 'overwrite'
  ) {
    const event: StructuredAccountEvent = {
      eventType: 'BULK_DATE_FILL_INITIATED',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        taskCount,
        kind,
        mode,
      },
    };
    logWithLevel('INFO', this.formatEvent(event));
  }

  /**
   * Log successful bulk date fill
   */
  static logBulkDateFillSuccess(
    userId: string,
    stats: {
      updated: number;
      skipped: number;
      failed: number;
    },
    duration?: number
  ) {
    const event: StructuredAccountEvent = {
      eventType: 'BULK_DATE_FILL_SUCCESS',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        ...stats,
      },
      duration,
    };
    logWithLevel('INFO', this.formatEvent(event));
  }

  /**
   * Log bulk date fill failure
   */
  static logBulkDateFillFailed(userId: string, reason: string, errorCode?: string) {
    const event: StructuredAccountEvent = {
      eventType: 'BULK_DATE_FILL_FAILED',
      userId,
      timestamp: new Date().toISOString(),
      details: {
        reason,
      },
      errorMessage: reason,
      errorCode,
    };
    logWithLevel('ERROR', this.formatEvent(event));
  }
}
