export const environment = {
  production: true,
  signalR: {
    url: 'https://signalr.sl56.com/signalr',
    hub: 'chatGroupHub',
    withCredentials: true,
    retry: {
      maxAttempts: 5,
      baseDelayMs: 800,
      maxDelayMs: 8000
    },
    log: false
  }
};
