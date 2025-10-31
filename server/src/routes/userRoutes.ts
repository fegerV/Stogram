import { Router } from 'express';
import {
  searchUsers,
  getUserById,
  updateProfile,
  changePassword,
  getContacts,
  addContact,
  removeContact,
  subscribeToPush,
  updateTheme,
  updatePrivacySettings,
  getPrivacySettings,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.delete('/contacts/:contactId', removeContact);
router.get('/privacy', getPrivacySettings);
router.patch('/privacy', updatePrivacySettings);
router.get('/:userId', getUserById);
router.patch('/profile', upload.single('avatar'), updateProfile);
router.post('/change-password', changePassword);
router.post('/push-subscription', subscribeToPush);
router.patch('/theme', updateTheme);

export default router;
