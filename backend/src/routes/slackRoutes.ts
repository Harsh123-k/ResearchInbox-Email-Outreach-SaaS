import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { SlackService } from '../services/slackService';

export const slackRouter = Router();

slackRouter.get('/authorize', authenticateToken, (req: AuthRequest, res) => {
  const url = SlackService.getAuthorizeUrl(req.user!.id);
  res.json({ url });
});

slackRouter.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const userId = (state as string) || 'default_user';

  if (code) {
    await SlackService.handleCallback(code as string, userId);
  }

  // Redirect back to frontend settings/dashboard
  res.send(`
    <html>
      <head><title>Slack Connected</title></head>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
        <h2 style="color: #059669;">✓ Slack Connected Successfully!</h2>
        <p>You can close this tab and return to ReachInbox.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'SLACK_CONNECTED' }, '*');
          }
          setTimeout(() => window.close(), 1800);
        </script>
      </body>
    </html>
  `);
});

slackRouter.get('/status', authenticateToken, (req: AuthRequest, res) => {
  const status = SlackService.getStatus(req.user!.id);
  res.json(status);
});

slackRouter.post('/connect-demo', authenticateToken, async (req: AuthRequest, res) => {
  const result = await SlackService.handleCallback('demo-code', req.user!.id);
  res.json(result);
});

slackRouter.post('/disconnect', authenticateToken, (req: AuthRequest, res) => {
  const result = SlackService.disconnect(req.user!.id);
  res.json(result);
});

slackRouter.post('/test-message', authenticateToken, async (req: AuthRequest, res) => {
  await SlackService.notify(req.user!.id, 'SCHEDULED', {
    recipient: 'test.lead@reachinbox.ai',
    subject: 'Welcome to ReachInbox Email Outreach Platform',
    scheduledTime: new Date(Date.now() + 60000).toISOString(),
  });
  res.json({ success: true, message: 'Test Slack alert sent!' });
});
