import { ForbiddenError } from '@/lib/errors';
import { AuthenticatedUser } from '@/types/auth';
import { UserRole } from '@/types/database';

export function authorizeRoles(user: AuthenticatedUser, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Access denied. Role '${user.role}' is not authorized to perform this action.`
    );
  }
}
