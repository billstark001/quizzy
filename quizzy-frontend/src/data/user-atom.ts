import { atom } from 'jotai';

/**
 * User information type
 * This is a placeholder for future user system implementation
 */
export type UserInfo = {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: 'user' | 'admin';
};

/**
 * User atom for managing user state
 * Currently returns null as user system is not yet implemented
 */
export const userAtom = atom<UserInfo | null>(null);

/**
 * User actions atom for future implementation
 */
export const userActionsAtom = atom(
  null,
  (_get, _set, action: 'login' | 'logout' | 'refresh') => {
    // Placeholder for future user system implementation
    switch (action) {
      case 'login':
        throw new Error('User login not yet implemented');
      case 'logout':
        throw new Error('User logout not yet implemented');
      case 'refresh':
        throw new Error('User refresh not yet implemented');
      default:
        throw new Error('Unknown action');
    }
  }
);
