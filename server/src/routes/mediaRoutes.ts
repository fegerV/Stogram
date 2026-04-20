import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { serveUploadedMedia } from '../controllers/mediaController';

const router = Router();

router.use((req, _res, next) => {
  const queryToken = typeof req.query.access_token === 'string' ? req.query.access_token : null;
  if (queryToken && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${queryToken}`;
  }
  next();
});

router.use(authenticate);
router.get('/uploads/*', serveUploadedMedia);

export default router;
