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
// server.router.use('AudioFiles2', serveStatic(path.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd')));
// server.router.use('audioFiles', serveStatic(path.join('public', 'audio_files')));
// server.router.use('AudioFiles4', serveStatic(path.join('public', 'grid_nav_assets/4_ambisonic_rirs_2nd')));
// server.router.use('AudioFilesPiano', serveStatic(path.join('public', 'piano')));
server.router.use('assets', serveStatic(path.join('public', 'assets')));
// server.router.use('/public/piano', serveStatic(path.join('public', 'piano')));
// server.router.use('/public/grid_nav_assets/1_binaural_encoded_music', serveStatic(path.join('public', 'grid_nav_assets/1_binaural_encoded_music')));


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
    name: 'assets',
    path: path.join(process.cwd(), 'public/assets'),
    publicDirectory: 'assets',
  },
  // {
  //   name: 'AudioFiles2',
  //   path: path.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd'),
  //   publicDirectory: 'AudioFiles2',
  // {
  //   name: 'audioFiles',
  //   path: path.join(process.cwd(), 'public/audio_files'),
  //   publicDirectory: 'audioFiles',
  // },
  // {
  //   name: 'AudioFiles3',
  //   path: path.join(process.cwd(), 'public/grid_nav_assets/3_binaural_rirs'),
  //   publicDirectory: 'AudioFiles3',
  // },
  // {
  //   name: 'AudioFiles4',
  //   path: path.join(process.cwd(), 'public/grid_nav_assets/4_ambisonic_rirs_2nd'),
  //   publicDirectory: 'AudioFiles4',
  // },
  // {
  //   name: 'AudioFilesPiano',
  //   path: path.join(process.cwd(), 'public/piano'),
  //   publicDirectory: 'AudioFilesPiano',
  // }
  ]
}, []);

server.pluginManager.register('audio-streams', pluginAudioStreamsFactory, {
//   directory: 'public/piano',
//   cache: true,
// },
// {
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
