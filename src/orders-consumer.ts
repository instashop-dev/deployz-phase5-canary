// Main-queue consumer: reads ONLY ORDERS_QUEUE_URL, receives one message,
// INSERTs it into the messages table, then deletes it.
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { Pool } from 'pg';

const queueUrl = process.env.ORDERS_QUEUE_URL ?? '';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sqs = new SQSClient({});

async function poll(): Promise<void> {
  while (true) {
    try {
      const out = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      }));
      for (const m of out.Messages ?? []) {
        if (!m.Body || !m.ReceiptHandle) continue;
        try {
          await pool.query(
            'INSERT INTO messages (body, received_at) VALUES ($1, NOW())',
            [m.Body],
          );
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: m.ReceiptHandle,
          }));
        } catch (err) {
          // Leave the message; visibility-timeout redrive will retry it.
          console.error('order processing failed', err);
        }
      }
    } catch (err) {
      console.error('queue poll failed', err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

void poll();
