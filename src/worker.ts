// Worker process: long-polls SQS, INSERTs each message into the messages
// table, deletes the message. Uses normal AWS SDK credential chain.
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { Pool } from 'pg';

const queueUrl = process.env.ORDERS_QUEUE_URL ?? '';
const dlqUrl = process.env.ORDERS_DLQ_URL ?? '';
const queueArn = process.env.ORDERS_QUEUE_ARN ?? '';

const sqs = new SQSClient({});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function poll(): Promise<void> {
  while (true) {
    try {
      const out = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      }));
      const messages = out.Messages ?? [];
      for (const m of messages) {
        if (!m.Body || !m.ReceiptHandle) continue;
        try {
          await pool.query(
            'INSERT INTO messages (queue_arn, body, received_at) VALUES ($1, $2, NOW())',
            [queueArn, m.Body],
          );
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: m.ReceiptHandle,
          }));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('message processing failed', err);
          // Leave message in queue; visibility timeout will redrive it. The
          // Deployz-provisioned DLQ picks up redrives that exhaust retries.
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('sqs poll failed', err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// DLQ URL is intentionally unused here: redrive policy is set at queue
// provisioning time, not in code. Keeping the env var documented.
void dlqUrl;

void poll();
