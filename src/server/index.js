import 'source-map-support/register';
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
server.router.use('AudioFiles0', serveStatic(path.join('public', 'grid_nav_assets/0_debug_grid')));
server.router.use('AudioFiles1', serveStatic(path.join('public', 'grid_nav_assets/1_binaural_encoded')));
server.router.use('AudioFilesMusic1', serveStatic(path.join('public', 'grid_nav_assets/1_binaural_encoded_music')));
server.router.use('AudioFilesMusic2', serveStatic(path.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd_music')));
server.router.use('AudioFiles2', serveStatic(path.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd')));
server.router.use('AudioFiles3', serveStatic(path.join('public', 'grid_nav_assets/3_binaural_rirs')));
server.router.use('AudioFiles4', serveStatic(path.join('public', 'grid_nav_assets/4_ambisonic_rirs_2nd')));
server.router.use('AudioFilesPiano', serveStatic(path.join('public', 'piano')));
server.router.use('Assets', serveStatic(path.join('public', 'grid_nav_assets/assets')));
server.router.use('/public/piano', serveStatic(path.join('public', 'piano')));
server.router.use('/public/grid_nav_assets/1_binaural_encoded_music', serveStatic(path.join('public', 'grid_nav_assets/1_binaural_encoded_music')));


import fs from 'fs';
// import JSON5 from 'json5';
// import path from 'path';

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

// const envConfigPath = path.join('public', 'grid_nav_assets', 'assets', `scene.json`)
// var envConfig = JSON5.parse(fs.readFileSync(envConfigPath, 'utf-8'));
// console.log(envConfig)

// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------

server.pluginManager.register('filesystem', pluginFilesystemFactory, {
  directories: [{
    name: 'Assets',
    path: path.join(process.cwd(), 'public/grid_nav_assets/assets'),
    publicDirectory: 'Assets',
  },
  {
    name: 'AudioFiles0',
    path: path.join(process.cwd(), 'public/grid_nav_assets/0_debug_grid'),
    publicDirectory: 'AudioFiles0',
  },
  {
    name: 'AudioFiles1',
    path: path.join(process.cwd(), 'public/grid_nav_assets/1_binaural_encoded'),
    publicDirectory: 'AudioFiles1',
  },
  {
    name: 'AudioFilesMusic1',
    path: path.join(process.cwd(), 'public/grid_nav_assets/1_binaural_encoded_music'),
    publicDirectory: 'AudioFilesMusic1',
  },
  {
    name: 'AudioFilesMusic2',
    path: path.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd_music'),
    publicDirectory: 'AudioFilesMusic2',
  },
  {
    name: 'AudioFiles2',
    path: path.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd'),
    publicDirectory: 'AudioFiles2',
  },
  {
    name: 'AudioFiles3',
    path: path.join(process.cwd(), 'public/grid_nav_assets/3_binaural_rirs'),
    publicDirectory: 'AudioFiles3',
  },
  {
    name: 'AudioFiles4',
    path: path.join(process.cwd(), 'public/grid_nav_assets/4_ambisonic_rirs_2nd'),
    publicDirectory: 'AudioFiles4',
  },
  {
    name: 'AudioFilesPiano',
    path: path.join(process.cwd(), 'public/piano'),
    publicDirectory: 'AudioFilesPiano',
  }]
}, []);

server.pluginManager.register('audio-streams', pluginAudioStreamsFactory, {
//   directory: 'public/piano',
//   cache: true,
// },
// {
  directory: 'public/grid_nav_assets/1_binaural_encoded_music',
  cache: true,
}, []);

server.pluginManager.register('audio-buffer-loader', pluginAudioBufferLoaderFactory, {}, []);

server.pluginManager.register('sync', pluginSyncFactory, {}, []);

server.pluginManager.register('platform', pluginPlatformFactory, {}, []);

// -------------------------------------------------------------------
// register schemas
// -------------------------------------------------------------------
// server.stateManager.registerSchema(name, schema);


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
