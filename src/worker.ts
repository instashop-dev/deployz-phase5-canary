// Worker entry: imports the queue consumer and the DLQ monitor. Each reads
// exactly ONE queue env var, matching the detection rule that requires a
// single queue URL per source file.
import './orders-consumer';
import './dlq-monitor';
