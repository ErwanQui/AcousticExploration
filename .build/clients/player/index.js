"use strict";

require("core-js/stable");

require("regenerator-runtime/runtime");

var _client = require("@soundworks/core/client");

var _initQos = _interopRequireDefault(require("@soundworks/template-helpers/client/init-qos.js"));

var _client2 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/client"));

var _client3 = _interopRequireDefault(require("@soundworks/plugin-filesystem/client"));

var _client4 = _interopRequireDefault(require("@soundworks/plugin-sync/client"));

var _client5 = _interopRequireDefault(require("@soundworks/plugin-platform/client"));

var _client6 = _interopRequireDefault(require("@soundworks/plugin-audio-streams/client"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Import plugin
const config = window.soundworksConfig; // store experiences of emulated clients

const experiences = new Set(); // import path from 'path';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext(); // import fs from 'fs';

async function launch($container, index) {
  try {
    const client = new _client.Client(); // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------

    client.pluginManager.register('filesystem', _client3.default, {}, []);
    client.pluginManager.register('audio-buffer-loader', _client2.default, {}, []);
    client.pluginManager.register('sync', _client4.default, {
      // choose the clock to synchronize, defaults to:
      // (where `startTime` is the time at which the plugin is instantiated)
      getTimeFunction: () => audioContext.currentTime
    }, []);
    client.pluginManager.register('platform', _client5.default, {
      features: [['web-audio', audioContext]]
    }, []);
    client.pluginManager.register('audio-streams', _client6.default, {
      audioContext
    }, ['platform']); // -------------------------------------------------------------------
    // launch application
    // -------------------------------------------------------------------

    await client.init(config);
    (0, _initQos.default)(client);
    const experience = new _PlayerExperience.default(client, config, $container, audioContext); // store exprience for emulated clients

    experiences.add(experience);
    document.body.classList.remove('loading'); // start all the things

    await client.start();
    experience.start();
    return Promise.resolve();
  } catch (err) {
    console.error(err);
  }
} // -------------------------------------------------------------------
// bootstrapping
// -------------------------------------------------------------------


const $container = document.querySelector('#__soundworks-container');
const searchParams = new URLSearchParams(window.location.search); // enable instanciation of multiple clients in the same page to facilitate
// development and testing (be careful in production...)

const numEmulatedClients = parseInt(searchParams.get('emulate')) || 1; // special logic for emulated clients (1 click to rule them all)

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
        experience.platform.onUserGesture(e);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJBdWRpb0NvbnRleHQiLCJ3ZWJraXRBdWRpb0NvbnRleHQiLCJhdWRpb0NvbnRleHQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsInBsdWdpblN5bmNGYWN0b3J5IiwiZ2V0VGltZUZ1bmN0aW9uIiwiY3VycmVudFRpbWUiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJmZWF0dXJlcyIsInBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnkiLCJpbml0IiwiaW5pdFFvUyIsImV4cGVyaWVuY2UiLCJQbGF5ZXJFeHBlcmllbmNlIiwiYWRkIiwiZG9jdW1lbnQiLCJib2R5IiwiY2xhc3NMaXN0IiwicmVtb3ZlIiwic3RhcnQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsInF1ZXJ5U2VsZWN0b3IiLCJzZWFyY2hQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJsb2NhdGlvbiIsInNlYXJjaCIsIm51bUVtdWxhdGVkQ2xpZW50cyIsInBhcnNlSW50IiwiZ2V0IiwiaSIsIiRkaXYiLCJjcmVhdGVFbGVtZW50IiwiYXBwZW5kQ2hpbGQiLCIkaW5pdFBsYXRmb3JtQnRuIiwidGV4dENvbnRlbnQiLCJpbml0UGxhdGZvcm1zIiwiZSIsImZvckVhY2giLCJwbGF0Zm9ybSIsIm9uVXNlckdlc3R1cmUiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiYWRkRXZlbnRMaXN0ZW5lciJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnY29yZS1qcy9zdGFibGUnO1xyXG5pbXBvcnQgJ3JlZ2VuZXJhdG9yLXJ1bnRpbWUvcnVudGltZSc7XHJcbmltcG9ydCB7IENsaWVudCB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcclxuaW1wb3J0IGluaXRRb1MgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvaW5pdC1xb3MuanMnO1xyXG5cclxuLy8gSW1wb3J0IHBsdWdpblxyXG5pbXBvcnQgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1hdWRpby1idWZmZXItbG9hZGVyL2NsaWVudCc7XHJcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9jbGllbnQnO1xyXG5pbXBvcnQgcGx1Z2luU3luY0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXN5bmMvY2xpZW50JztcclxuaW1wb3J0IHBsdWdpblBsYXRmb3JtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tcGxhdGZvcm0vY2xpZW50JztcclxuaW1wb3J0IHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLXN0cmVhbXMvY2xpZW50JztcclxuXHJcblxyXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xyXG5cclxuY29uc3QgY29uZmlnID0gd2luZG93LnNvdW5kd29ya3NDb25maWc7XHJcbi8vIHN0b3JlIGV4cGVyaWVuY2VzIG9mIGVtdWxhdGVkIGNsaWVudHNcclxuY29uc3QgZXhwZXJpZW5jZXMgPSBuZXcgU2V0KCk7XHJcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5jb25zdCBBdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XHJcbmNvbnN0IGF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcclxuLy8gaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgkY29udGFpbmVyLCBpbmRleCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVnaXN0ZXIgcGx1Z2luc1xyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge30sIFtdKTtcclxuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7fSwgW10pXHJcbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3Rlcignc3luYycsIHBsdWdpblN5bmNGYWN0b3J5LCB7XHJcbiAgICAgIC8vIGNob29zZSB0aGUgY2xvY2sgdG8gc3luY2hyb25pemUsIGRlZmF1bHRzIHRvOlxyXG4gICAgICAvLyAod2hlcmUgYHN0YXJ0VGltZWAgaXMgdGhlIHRpbWUgYXQgd2hpY2ggdGhlIHBsdWdpbiBpcyBpbnN0YW50aWF0ZWQpXHJcbiAgICAgIGdldFRpbWVGdW5jdGlvbjogKCkgPT4gYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lLFxyXG4gICAgfSwgW10pO1xyXG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ3BsYXRmb3JtJywgcGx1Z2luUGxhdGZvcm1GYWN0b3J5LCB7XHJcbiAgICAgIGZlYXR1cmVzOiBbXHJcbiAgICAgICAgWyd3ZWItYXVkaW8nLCBhdWRpb0NvbnRleHRdLFxyXG4gICAgICBdXHJcbiAgICB9LCBbXSk7XHJcbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tc3RyZWFtcycsIHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnksIHtcclxuICAgICAgYXVkaW9Db250ZXh0LFxyXG4gICAgfSwgWydwbGF0Zm9ybSddKTtcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGxhdW5jaCBhcHBsaWNhdGlvblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgYXdhaXQgY2xpZW50LmluaXQoY29uZmlnKTtcclxuICAgIGluaXRRb1MoY2xpZW50KTtcclxuXHJcbiAgICBjb25zdCBleHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2UoY2xpZW50LCBjb25maWcsICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCk7XHJcbiAgICAvLyBzdG9yZSBleHByaWVuY2UgZm9yIGVtdWxhdGVkIGNsaWVudHNcclxuICAgIGV4cGVyaWVuY2VzLmFkZChleHBlcmllbmNlKTtcclxuXHJcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcclxuXHJcbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xyXG4gICAgYXdhaXQgY2xpZW50LnN0YXJ0KCk7XHJcbiAgICBleHBlcmllbmNlLnN0YXJ0KCk7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH0gY2F0Y2goZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIGJvb3RzdHJhcHBpbmdcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5jb25zdCAkY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI19fc291bmR3b3Jrcy1jb250YWluZXInKTtcclxuY29uc3Qgc2VhcmNoUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcclxuLy8gZW5hYmxlIGluc3RhbmNpYXRpb24gb2YgbXVsdGlwbGUgY2xpZW50cyBpbiB0aGUgc2FtZSBwYWdlIHRvIGZhY2lsaXRhdGVcclxuLy8gZGV2ZWxvcG1lbnQgYW5kIHRlc3RpbmcgKGJlIGNhcmVmdWwgaW4gcHJvZHVjdGlvbi4uLilcclxuY29uc3QgbnVtRW11bGF0ZWRDbGllbnRzID0gcGFyc2VJbnQoc2VhcmNoUGFyYW1zLmdldCgnZW11bGF0ZScpKSB8fCAxO1xyXG5cclxuLy8gc3BlY2lhbCBsb2dpYyBmb3IgZW11bGF0ZWQgY2xpZW50cyAoMSBjbGljayB0byBydWxlIHRoZW0gYWxsKVxyXG5pZiAobnVtRW11bGF0ZWRDbGllbnRzID4gMSkge1xyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtRW11bGF0ZWRDbGllbnRzOyBpKyspIHtcclxuICAgIGNvbnN0ICRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICRkaXYuY2xhc3NMaXN0LmFkZCgnZW11bGF0ZScpO1xyXG4gICAgJGNvbnRhaW5lci5hcHBlbmRDaGlsZCgkZGl2KTtcclxuXHJcbiAgICBsYXVuY2goJGRpdiwgaSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCAkaW5pdFBsYXRmb3JtQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgJGluaXRQbGF0Zm9ybUJ0bi5jbGFzc0xpc3QuYWRkKCdpbml0LXBsYXRmb3JtJyk7XHJcbiAgJGluaXRQbGF0Zm9ybUJ0bi50ZXh0Q29udGVudCA9ICdyZXN1bWUgYWxsJztcclxuXHJcbiAgZnVuY3Rpb24gaW5pdFBsYXRmb3JtcyhlKSB7XHJcbiAgICBleHBlcmllbmNlcy5mb3JFYWNoKGV4cGVyaWVuY2UgPT4ge1xyXG4gICAgICBpZiAoZXhwZXJpZW5jZS5wbGF0Zm9ybSkge1xyXG4gICAgICAgIGV4cGVyaWVuY2UucGxhdGZvcm0ub25Vc2VyR2VzdHVyZShlKVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBpbml0UGxhdGZvcm1zKTtcclxuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGluaXRQbGF0Zm9ybXMpO1xyXG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmUoKTtcclxuICB9XHJcblxyXG4gICRpbml0UGxhdGZvcm1CdG4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBpbml0UGxhdGZvcm1zKTtcclxuICAkaW5pdFBsYXRmb3JtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBpbml0UGxhdGZvcm1zKTtcclxuXHJcbiAgJGNvbnRhaW5lci5hcHBlbmRDaGlsZCgkaW5pdFBsYXRmb3JtQnRuKTtcclxufSBlbHNlIHtcclxuICBsYXVuY2goJGNvbnRhaW5lciwgMCk7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOzs7O0FBUkE7QUFVQSxNQUFNQSxNQUFNLEdBQUdDLE1BQU0sQ0FBQ0MsZ0JBQXRCLEMsQ0FDQTs7QUFDQSxNQUFNQyxXQUFXLEdBQUcsSUFBSUMsR0FBSixFQUFwQixDLENBQ0E7O0FBQ0EsTUFBTUMsWUFBWSxHQUFHSixNQUFNLENBQUNJLFlBQVAsSUFBdUJKLE1BQU0sQ0FBQ0ssa0JBQW5EO0FBQ0EsTUFBTUMs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