// minimalistic, non subtle QoS
// to be improved little by little...
export default function initQoS(client, {
  socketClosed = true,
  visibilityChange = true,
} = {}) {
  if (socketClosed) {
    client.socket.addListener('close', () => {
      setTimeout(() => window.location.reload(true), 2000);
    });
  }

  if (visibilityChange) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // differ by a few milliseconds, as the event is trigerred before the change
        // see. https://github.com/collective-soundworks/soundworks/issues/42
        setTimeout(() => {
          window.location.reload(true);
        }, 50);
      }
    }, false);
  }
}
