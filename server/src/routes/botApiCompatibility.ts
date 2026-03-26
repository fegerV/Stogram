import express from 'express';
import {
  answerCallbackQuery,
  answerInlineQuery,
  deleteWebhook,
  deleteMessage,
  editMessageText,
  getChatMenuButton,
  getMe,
  getMyCommands,
  getUpdates,
  getWebhookInfo,
  sendAudio,
  sendDocument,
  sendMessage,
  sendPhoto,
  sendVideo,
  setChatMenuButton,
  setMyCommands,
  setWebhook,
} from '../controllers/botApiCompatibilityController';

const router = express.Router();

router.get('/bot:token/getMe', getMe);
router.post('/bot:token/getMe', getMe);

router.get('/bot:token/getWebhookInfo', getWebhookInfo);
router.post('/bot:token/setWebhook', setWebhook);
router.post('/bot:token/deleteWebhook', deleteWebhook);

router.get('/bot:token/getUpdates', getUpdates);
router.post('/bot:token/getUpdates', getUpdates);

router.get('/bot:token/getMyCommands', getMyCommands);
router.post('/bot:token/setMyCommands', setMyCommands);
router.get('/bot:token/getChatMenuButton', getChatMenuButton);
router.post('/bot:token/setChatMenuButton', setChatMenuButton);

router.post('/bot:token/sendMessage', sendMessage);
router.post('/bot:token/sendPhoto', sendPhoto);
router.post('/bot:token/sendDocument', sendDocument);
router.post('/bot:token/sendVideo', sendVideo);
router.post('/bot:token/sendAudio', sendAudio);
router.post('/bot:token/editMessageText', editMessageText);
router.post('/bot:token/deleteMessage', deleteMessage);
router.post('/bot:token/answerCallbackQuery', answerCallbackQuery);
router.post('/bot:token/answerInlineQuery', answerInlineQuery);

export default router;
