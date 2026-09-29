// Web process: serves /health and /publish.
// /publish enqueues one message into the canary SQS queue and returns 202.
// The SqsClient is constructed without static credentials so it uses the
// normal AWS SDK credential provider chain (the task role).
import express, { Request, Response } from 'express';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const port = Number(process.env.PORT ?? 3000);
const queueUrl = process.env.ORDERS_QUEUE_URL ?? '';

const sqs = new SQSClient({});

const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.post('/publish', async (req: Request, res: Response) => {
  const body = JSON.stringify({
    text: typeof req.body?.text === 'string' ? req.body.text : 'hello',
    ts: Date.now(),
  });
  const cmd = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: body,
  });
  await sqs.send(cmd);
  res.status(202).json({ ok: true, body });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`canary web listening on ${port}`);
});
