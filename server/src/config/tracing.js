import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import env from './env.js';

const exporter = new OTLPTraceExporter({
  url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: {
    'Content-Type': 'application/x-protobuf',
  },
});

const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: env.OTEL_SERVICE_NAME || 'antriin-server',
  [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

export default sdk;