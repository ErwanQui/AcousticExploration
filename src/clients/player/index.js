import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/template-helpers/client/init-qos.js';

// Import plugin
import pluginAudioBufferLoaderFactory from '@soundworks/plugin-audio-buffer-loader/client';
import pluginFilesystemFactory from '@soundworks/plugin-filesystem/client';
import pluginSyncFactory from '@soundworks/plugin-sync/client';
import pluginPlatformFactory from '@soundworks/plugin-platform/client';

import PlayerExperience from './PlayerExperience.js';

const config = window.soundworksConfig;
// store experiences of emulated clients
const experiences = new Set();
// import path from 'path';
const audioContext = new AudioContext();
// import fs from 'fs';

async function launch($container, index) {
  try {
    const client = new Client();

    // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------
    client.pluginManager.register('filesystem', pluginFilesystemFactory, {}, []);
    client.pluginManager.register('audio-buffer-loader', pluginAudioBufferLoaderFactory, {  
      data: {'steliz_octamic_m02_(ACN-SN3D-2).wav': 'grid_nav_assets/2_ambisonic_encoded_2nd/steliz_octamic_m02_(ACN-SN3D-2)_01-08ch.wav'}
    }, [])
    // client.pluginManager.register('sync', pluginSyncFactory, {
    //   // choose the clock to synchronize, defaults to:
    //   // (where `startTime` is the time at which the plugin is instantiated)
    //   getTimeFunction: () => audioContext.currentTime,
    // }, []);
    client.pluginManager.register('platform', pluginPlatformFactory, {
      features: [
        ['web-audio', audioContext],
      ]
    }, []);   
    // -------------------------------------------------------------------
    // launch application
    // -------------------------------------------------------------------
    await client.init(config);
    initQoS(client);

    const experience = new PlayerExperience(client, config, $container, audioContext);
    // store exprience for emulated clients
    experiences.add(experience);

    document.body.classList.remove('loading');

    // start all the things
    await client.start();
    experience.start();

    return Promise.resolve();
  } catch(err) {
    console.error(err);
  }
}

// -------------------------------------------------------------------
// bootstrapping
// -------------------------------------------------------------------
const $container = document.querySelector('#__soundworks-container');
const searchParams = new URLSearchParams(window.location.search);
// enable instanciation of multiple clients in the same page to facilitate
// development and testing (be careful in production...)
const numEmulatedClients = parseInt(searchParams.get('emulate')) || 1;

// special logic for emulated clients (1 click to rule them all)
if (numEmulatedClients > 1) {
  for (let i = 0; i < numEmulatedClients; i++) {
    const $div = document.createElement('div');
    $div.classList.add('emulate');
    $container.appendChild($div);

    launch($div, i);
  }

  const $initPlatformBtn = document.createElement('div');
  $initPlatformBtn.classList.add('init-platform');
  $initPlatformBtn.textContent = 'resume all';

  function initPlatforms(e) {
    experiences.forEach(experience => {
      if (experience.platform) {
        experience.platform.onUserGesture(e)
      }
    });
    $initPlatformBtn.removeEventListener('touchend', initPlatforms);
    $initPlatformBtn.removeEventListener('mouseup', initPlatforms);
    $initPlatformBtn.remove();
  }

  $initPlatformBtn.addEventListener('touchend', initPlatforms);
  $initPlatformBtn.addEventListener('mouseup', initPlatforms);

  $container.appendChild($initPlatformBtn);
} else {
  launch($container, 0);
}
