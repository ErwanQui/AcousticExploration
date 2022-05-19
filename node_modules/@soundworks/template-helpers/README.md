# `@soundworks/template-helpers`

> Set of common helpers for applications based on the [`soundworks-template`](https://github.com/collective-soundworks/soundworks-template). 
>
> _Helpers are already installed in the `soundworks-template`_

## Installation

```
npm install --save @soundworks/template-helpers
```

## `initQoS`

Initialize generic quality of service strategies.

For now, basically reload application when socket close or on visibility change.
__more refined strategies should be created over time.__

### Arguments

- `client {soundworks.Client}` - the soundworks client instance
- `options {Object}`
  + `options.socketClosed = true` - reloads the page if the socket connection is lost, 
    e.g. you generally don't want a client that cannot receive stop messages in a performance.
  + `options.visibilityChange = true` - reloads the page on visiblity change (
    e.g. when your page is no longer the focused tab all scheduling is broken

### Usage

```
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/helpers/client/init-qos.js';

async function launch() {
  try {
    const client = new Client();
    await client.init(window.soundworksConfig);
    initQoS(client);

    // ...
  } catch(err) {
    console.error(err);
  }
}

launch();
```


## `renderInitializationScreens`

Display generic initialization screens for plugins

### Usage

```
import { Experience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class ControllerExperience extends Experience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;

    renderInitializationScreens(client, config, $container);
  }

  // ...
}
```

## License

BSD-3-Clause
