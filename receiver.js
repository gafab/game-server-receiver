// Receptor de Chromecast (Cast Application Framework).
// El teléfono host le reenvía, por un canal propio, los mismos mensajes que recibe /tv.
import { createTvApp } from './tv-app.js';

const NAMESPACE = 'urn:x-cast:com.gafab.gameserver';

const app = createTvApp({ base: document.baseURI });
const context = cast.framework.CastReceiverContext.getInstance();

context.addCustomMessageListener(NAMESPACE, (event) => {
  const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
  app.handle(msg);
});

// Pide el estado completo al conectarse un sender (también tras recargar el receptor).
context.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, (event) => {
  context.sendCustomMessage(NAMESPACE, event.senderId, { t: 'ready' });
});

const options = new cast.framework.CastReceiverOptions();
options.customNamespaces = { [NAMESPACE]: cast.framework.system.MessageType.JSON };
options.disableIdleTimeout = true;
context.start(options);
