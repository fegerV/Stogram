import { Router } from 'express';
import {
  searchUsers,
  getUserById,
  updateProfile,
  changePassword,
  getContacts,
  addContact,
  removeContact,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.delete('/contacts/:contactId', removeContact);
router.get('/:userId', getUserById);
router.patch('/profile', upload.single('avatar'), updateProfile);
router.post('/change-password', changePassword);

export default router;
