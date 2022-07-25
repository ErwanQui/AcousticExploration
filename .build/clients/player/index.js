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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJBdWRpb0NvbnRleHQiLCJ3ZWJraXRBdWRpb0NvbnRleHQiLCJhdWRpb0NvbnRleHQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsInBsdWdpblN5bmNGYWN0b3J5IiwiZ2V0VGltZUZ1bmN0aW9uIiwiY3VycmVudFRpbWUiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJmZWF0dXJlcyIsInBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnkiLCJpbml0IiwiaW5pdFFvUyIsImV4cGVyaWVuY2UiLCJQbGF5ZXJFeHBlcmllbmNlIiwiYWRkIiwiZG9jdW1lbnQiLCJib2R5IiwiY2xhc3NMaXN0IiwicmVtb3ZlIiwic3RhcnQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsInF1ZXJ5U2VsZWN0b3IiLCJzZWFyY2hQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJsb2NhdGlvbiIsInNlYXJjaCIsIm51bUVtdWxhdGVkQ2xpZW50cyIsInBhcnNlSW50IiwiZ2V0IiwiaSIsIiRkaXYiLCJjcmVhdGVFbGVtZW50IiwiYXBwZW5kQ2hpbGQiLCIkaW5pdFBsYXRmb3JtQnRuIiwidGV4dENvbnRlbnQiLCJpbml0UGxhdGZvcm1zIiwiZSIsImZvckVhY2giLCJwbGF0Zm9ybSIsIm9uVXNlckdlc3R1cmUiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiYWRkRXZlbnRMaXN0ZW5lciJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnY29yZS1qcy9zdGFibGUnO1xuaW1wb3J0ICdyZWdlbmVyYXRvci1ydW50aW1lL3J1bnRpbWUnO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IGluaXRRb1MgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvaW5pdC1xb3MuanMnO1xuXG4vLyBJbXBvcnQgcGx1Z2luXG5pbXBvcnQgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1hdWRpby1idWZmZXItbG9hZGVyL2NsaWVudCc7XG5pbXBvcnQgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWZpbGVzeXN0ZW0vY2xpZW50JztcbmltcG9ydCBwbHVnaW5TeW5jRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tc3luYy9jbGllbnQnO1xuaW1wb3J0IHBsdWdpblBsYXRmb3JtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tcGxhdGZvcm0vY2xpZW50JztcbmltcG9ydCBwbHVnaW5BdWRpb1N0cmVhbXNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1hdWRpby1zdHJlYW1zL2NsaWVudCc7XG5cblxuaW1wb3J0IFBsYXllckV4cGVyaWVuY2UgZnJvbSAnLi9QbGF5ZXJFeHBlcmllbmNlLmpzJztcblxuY29uc3QgY29uZmlnID0gd2luZG93LnNvdW5kd29ya3NDb25maWc7XG4vLyBzdG9yZSBleHBlcmllbmNlcyBvZiBlbXVsYXRlZCBjbGllbnRzXG5jb25zdCBleHBlcmllbmNlcyA9IG5ldyBTZXQoKTtcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuY29uc3QgQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuY29uc3QgYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuLy8gaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuYXN5bmMgZnVuY3Rpb24gbGF1bmNoKCRjb250YWluZXIsIGluZGV4KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IENsaWVudCgpO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIHJlZ2lzdGVyIHBsdWdpbnNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge30sIFtdKTtcbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tYnVmZmVyLWxvYWRlcicsIHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSwge30sIFtdKVxuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdzeW5jJywgcGx1Z2luU3luY0ZhY3RvcnksIHtcbiAgICAgIC8vIGNob29zZSB0aGUgY2xvY2sgdG8gc3luY2hyb25pemUsIGRlZmF1bHRzIHRvOlxuICAgICAgLy8gKHdoZXJlIGBzdGFydFRpbWVgIGlzIHRoZSB0aW1lIGF0IHdoaWNoIHRoZSBwbHVnaW4gaXMgaW5zdGFudGlhdGVkKVxuICAgICAgZ2V0VGltZUZ1bmN0aW9uOiAoKSA9PiBhdWRpb0NvbnRleHQuY3VycmVudFRpbWUsXG4gICAgfSwgW10pO1xuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdwbGF0Zm9ybScsIHBsdWdpblBsYXRmb3JtRmFjdG9yeSwge1xuICAgICAgZmVhdHVyZXM6IFtcbiAgICAgICAgWyd3ZWItYXVkaW8nLCBhdWRpb0NvbnRleHRdLFxuICAgICAgXVxuICAgIH0sIFtdKTtcbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tc3RyZWFtcycsIHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnksIHtcbiAgICAgIGF1ZGlvQ29udGV4dCxcbiAgICB9LCBbJ3BsYXRmb3JtJ10pO1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBsYXVuY2ggYXBwbGljYXRpb25cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXdhaXQgY2xpZW50LmluaXQoY29uZmlnKTtcbiAgICBpbml0UW9TKGNsaWVudCk7XG5cbiAgICBjb25zdCBleHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2UoY2xpZW50LCBjb25maWcsICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCk7XG4gICAgLy8gc3RvcmUgZXhwcmllbmNlIGZvciBlbXVsYXRlZCBjbGllbnRzXG4gICAgZXhwZXJpZW5jZXMuYWRkKGV4cGVyaWVuY2UpO1xuXG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG5cbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xuICAgIGF3YWl0IGNsaWVudC5zdGFydCgpO1xuICAgIGV4cGVyaWVuY2Uuc3RhcnQoKTtcblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSBjYXRjaChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gYm9vdHN0cmFwcGluZ1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3QgJGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNfX3NvdW5kd29ya3MtY29udGFpbmVyJyk7XG5jb25zdCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuLy8gZW5hYmxlIGluc3RhbmNpYXRpb24gb2YgbXVsdGlwbGUgY2xpZW50cyBpbiB0aGUgc2FtZSBwYWdlIHRvIGZhY2lsaXRhdGVcbi8vIGRldmVsb3BtZW50IGFuZCB0ZXN0aW5nIChiZSBjYXJlZnVsIGluIHByb2R1Y3Rpb24uLi4pXG5jb25zdCBudW1FbXVsYXRlZENsaWVudHMgPSBwYXJzZUludChzZWFyY2hQYXJhbXMuZ2V0KCdlbXVsYXRlJykpIHx8IDE7XG5cbi8vIHNwZWNpYWwgbG9naWMgZm9yIGVtdWxhdGVkIGNsaWVudHMgKDEgY2xpY2sgdG8gcnVsZSB0aGVtIGFsbClcbmlmIChudW1FbXVsYXRlZENsaWVudHMgPiAxKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtRW11bGF0ZWRDbGllbnRzOyBpKyspIHtcbiAgICBjb25zdCAkZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgJGRpdi5jbGFzc0xpc3QuYWRkKCdlbXVsYXRlJyk7XG4gICAgJGNvbnRhaW5lci5hcHBlbmRDaGlsZCgkZGl2KTtcblxuICAgIGxhdW5jaCgkZGl2LCBpKTtcbiAgfVxuXG4gIGNvbnN0ICRpbml0UGxhdGZvcm1CdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgJGluaXRQbGF0Zm9ybUJ0bi5jbGFzc0xpc3QuYWRkKCdpbml0LXBsYXRmb3JtJyk7XG4gICRpbml0UGxhdGZvcm1CdG4udGV4dENvbnRlbnQgPSAncmVzdW1lIGFsbCc7XG5cbiAgZnVuY3Rpb24gaW5pdFBsYXRmb3JtcyhlKSB7XG4gICAgZXhwZXJpZW5jZXMuZm9yRWFjaChleHBlcmllbmNlID0+IHtcbiAgICAgIGlmIChleHBlcmllbmNlLnBsYXRmb3JtKSB7XG4gICAgICAgIGV4cGVyaWVuY2UucGxhdGZvcm0ub25Vc2VyR2VzdHVyZShlKVxuICAgICAgfVxuICAgIH0pO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBpbml0UGxhdGZvcm1zKTtcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBpbml0UGxhdGZvcm1zKTtcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZSgpO1xuICB9XG5cbiAgJGluaXRQbGF0Zm9ybUJ0bi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGluaXRQbGF0Zm9ybXMpO1xuICAkaW5pdFBsYXRmb3JtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBpbml0UGxhdGZvcm1zKTtcblxuICAkY29udGFpbmVyLmFwcGVuZENoaWxkKCRpbml0UGxhdGZvcm1CdG4pO1xufSBlbHNlIHtcbiAgbGF1bmNoKCRjb250YWluZXIsIDApO1xufVxuIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOzs7O0FBUkE7QUFVQSxNQUFNQSxNQUFNLEdBQUdDLE1BQU0sQ0FBQ0MsZ0JBQXRCLEMsQ0FDQTs7QUFDQSxNQUFNQyxXQUFXLEdBQUcsSUFBSUMsR0FBSixFQUFwQixDLENBQ0E7O0FBQ0EsTUFBTUMsWUFBWSxHQUFHSixNQUFNLENBQUNJLFlBQVAsSUFBdUJKLE1BQU0sQ0FBQ0ssa0JBQW5EO0FBQ0EsTUFBTUMsWUFBWSxHQUFHLElBQUlGLFlBQUosRUFBckIsQyxDQUNBOztBQUVBLGVBQWVHLE1BQWYsQ0FBc0JDLFVBQXRCLEVBQWtDQyxLQUFsQyxFQUF5QztFQUN2QyxJQUFJO0lBQ0YsTUFBTUMsTUFBTSxHQUFHLElBQUlDLGNBQUosRUFBZixDQURFLENBR0Y7SUFDQTtJQUNBOztJQUNBRCxNQUFNLENBQUNFLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLFlBQTlCLEVBQTRDQyxnQkFBNUMsRUFB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