// Dead-letter-queue monitor: reads ONLY ORDERS_DLQ_URL. Receives one message
// from the DLQ so the dead-letter edge has a real consumer, matching the
// queue-with-DLQ composition Deployz provisions.
import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

const dlqUrl = process.env.ORDERS_DLQ_URL ?? '';
const sqs = new SQSClient({});

async function poll(): Promise<void> {
  while (true) {
    try {
      await sqs.send(new ReceiveMessageCommand({
        QueueUrl: dlqUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      }));
    } catch (err) {
      console.error('dlq poll failed', err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

void poll();
