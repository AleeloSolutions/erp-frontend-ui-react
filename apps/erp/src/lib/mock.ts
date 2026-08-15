/** Simulated network latency for mock APIs (ms). */
export function mockDelay(ms = 450): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class MockApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}
