import { Router } from 'express';
import {
  searchUsers,
  getUserById,
  getCurrentUser,
  updateProfile,
  changePassword,
  getContacts,
  addContact,
  removeContact,
  subscribeToPush,
  updateTheme,
  updatePrivacySettings,
  getPrivacySettings,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/userController';
import {
  getSessions,
  revokeSession,
  revokeAllSessions,
} from '../controllers/sessionController';
import {
  getStorageInfo,
  clearCache,
  exportData,
  importData,
} from '../controllers/accountController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/me', getCurrentUser);
router.get('/search', searchUsers);
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.delete('/contacts/:contactId', removeContact);
router.get('/privacy', getPrivacySettings);
router.patch('/privacy', updatePrivacySettings);
router.get('/notifications', getNotificationPreferences);
router.patch('/notifications', updateNotificationPreferences);
router.patch('/profile', upload.single('avatar'), updateProfile);
router.post('/change-password', changePassword);
router.post('/push-subscription', subscribeToPush);
router.patch('/theme', updateTheme);

router.get('/sessions', getSessions);
router.delete('/sessions/:id', revokeSession);
router.delete('/sessions', revokeAllSessions);

router.get('/storage', getStorageInfo);
router.post('/storage/clear-cache', clearCache);
router.get('/export', exportData);
router.post('/import', importData);

router.get('/:userId', getUserById);

export default router;
