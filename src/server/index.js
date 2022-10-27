// import 'source-map-support/register';

import { Server } from '@soundworks/core/server';
import path from 'path';
import serveStatic from 'serve-static';
import compile from 'template-literal';

import pluginAudioBufferLoaderFactory from '@soundworks/plugin-audio-buffer-loader/server';
import pluginFilesystemFactory from '@soundworks/plugin-filesystem/server';
import pluginSyncFactory from '@soundworks/plugin-sync/server';
import pluginPlatformFactory from '@soundworks/plugin-platform/server';
import pluginAudioStreamsFactory from '@soundworks/plugin-audio-streams/server';

import PlayerExperience from './PlayerExperience.js';

import getConfig from './utils/getConfig.js';
const ENV = process.env.ENV || 'default';
const config = getConfig(ENV);

const server = new Server();

// html template and static files (in most case, this should not be modified)
server.templateEngine = { compile };
server.templateDirectory = path.join('.build', 'server', 'tmpl');
server.router.use(serveStatic('public'));
server.router.use('build', serveStatic(path.join('.build', 'public')));
server.router.use('vendors', serveStatic(path.join('.vendors', 'public')));
server.router.use('images', serveStatic(path.join('public', 'images')));
server.router.use('assets', serveStatic(path.join('public', 'assets')));


// import fs from 'fs';

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------

server.pluginManager.register('filesystem', pluginFilesystemFactory, {
  directories: [{
    name: 'assets',
    path: path.join(process.cwd(), 'public/assets'),
    publicDirectory: 'assets',
  }]
}, []);

server.pluginManager.register('audio-streams', pluginAudioStreamsFactory, {
  directory: 'public/audio_files',
  cache: true,
  compress: false
}, []);

server.pluginManager.register('audio-buffer-loader', pluginAudioBufferLoaderFactory, {}, []);

server.pluginManager.register('sync', pluginSyncFactory, {}, []);

server.pluginManager.register('platform', pluginPlatformFactory, {}, []);

(async function launch() {
  try {
    // @todo - check how this behaves with a node client...
    await server.init(config, (clientType, config, httpRequest) => {
      return {
        clientType: clientType,
        app: {
          name: config.app.name,
          author: config.app.author,
        },
        env: {
          type: config.env.type,
          websockets: config.env.websockets,
          assetsDomain: config.env.assetsDomain,
        }
      };
    });

    const playerExperience = new PlayerExperience(server, 'player');

    // start all the things
    await server.start();
    playerExperience.start();

  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
