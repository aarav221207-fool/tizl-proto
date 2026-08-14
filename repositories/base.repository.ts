import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { ApiError, NotFoundError, BadRequestError } from '@/lib/errors';

export abstract class BaseRepository<T extends keyof Database['public']['Tables']> {
  protected tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  /**
   * Helper to execute query and convert Supabase errors to domain ApiErrors
   */
  protected async handleQuery<R>(
    queryPromise: PromiseLike<{ data: R | null; error: unknown }>
  ): Promise<R> {
    const { data, error } = await queryPromise;

    if (error) {
      console.error(`Database error on ${String(this.tableName)}:`, error);
      const message = typeof error === 'object' && error && 'message' in error ? String((error as { message: string }).message) : 'Database operation failed';
      throw new BadRequestError(message, error);
    }

    if (data === null) {
      throw new NotFoundError(`Record not found in ${String(this.tableName)}`);
    }

    return data;
  }

  /**
   * Safe optional query returning null if not found
   */
  protected async handleOptionalQuery<R>(
    queryPromise: PromiseLike<{ data: R | null; error: unknown }>
  ): Promise<R | null> {
    const { data, error } = await queryPromise;

    if (error) {
      console.error(`Database query error on ${String(this.tableName)}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Helper for recording audit logs for sensitive operations
   */
  protected async recordAuditLog(
    client: SupabaseClient<Database>,
    profileId: string | null,
    action: string,
    recordId: string | null,
    oldData?: Record<string, unknown> | null,
    newData?: Record<string, unknown> | null
  ) {
    try {
      await client.from('audit_logs').insert({
        profile_id: profileId,
        action,
        table_name: String(this.tableName),
        record_id: recordId,
        old_data: oldData || null,
        new_data: newData || null,
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}
