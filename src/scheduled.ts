[
      "import pg from 'pg';",
      "import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';",
      'const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });',
      'const s3 = new S3Client({});',
      'async function run() {',
      "  await pool.query(\"DELETE FROM orders WHERE created_at < NOW() - INTERVAL '7 days'\");",
      '  await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: "tmp/expired" }));',
      '  process.exit(0);',
      '}',
      'run();',
      '',
    ].join('\n')