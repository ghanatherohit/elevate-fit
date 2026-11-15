declare module "@sentry/nextjs" {
  export function init(options: {
    dsn: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
  }): void;
}
