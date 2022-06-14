"use strict";

require("core-js/stable");

require("regenerator-runtime/runtime");

var _client = require("@soundworks/core/client");

var _initQos = _interopRequireDefault(require("@soundworks/template-helpers/client/init-qos.js"));

var _client2 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/client"));

var _client3 = _interopRequireDefault(require("@soundworks/plugin-filesystem/client"));

var _client4 = _interopRequireDefault(require("@soundworks/plugin-sync/client"));

var _client5 = _interopRequireDefault(require("@soundworks/plugin-platform/client"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Import plugin
const config = window.soundworksConfig; // store experiences of emulated clients

const experiences = new Set(); // import path from 'path';

const audioContext = new AudioContext(); // import fs from 'fs';

async function launch($container, index) {
  try {
    const client = new _client.Client(); // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------

    client.pluginManager.register('filesystem', _client3.default, {}, []);
    client.pluginManager.register('audio-buffer-loader', _client2.default, {}, []); // client.pluginManager.register('sync', pluginSyncFactory, {
    //   // choose the clock to synchronize, defaults to:
    //   // (where `startTime` is the time at which the plugin is instantiated)
    //   getTimeFunction: () => audioContext.currentTime,
    // }, []);

    client.pluginManager.register('platform', _client5.default, {
      features: [['web-audio', audioContext]]
    }, []); // -------------------------------------------------------------------
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsInBsdWdpblBsYXRmb3JtRmFjdG9yeSIsImZlYXR1cmVzIiwiaW5pdCIsImluaXRRb1MiLCJleHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsImFkZCIsImRvY3VtZW50IiwiYm9keSIsImNsYXNzTGlzdCIsInJlbW92ZSIsInN0YXJ0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJxdWVyeVNlbGVjdG9yIiwic2VhcmNoUGFyYW1zIiwiVVJMU2VhcmNoUGFyYW1zIiwibG9jYXRpb24iLCJzZWFyY2giLCJudW1FbXVsYXRlZENsaWVudHMiLCJwYXJzZUludCIsImdldCIsImkiLCIkZGl2IiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwiJGluaXRQbGF0Zm9ybUJ0biIsInRleHRDb250ZW50IiwiaW5pdFBsYXRmb3JtcyIsImUiLCJmb3JFYWNoIiwicGxhdGZvcm0iLCJvblVzZXJHZXN0dXJlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiXSwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ2NvcmUtanMvc3RhYmxlJztcbmltcG9ydCAncmVnZW5lcmF0b3ItcnVudGltZS9ydW50aW1lJztcbmltcG9ydCB7IENsaWVudCB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCBpbml0UW9TIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L2luaXQtcW9zLmpzJztcblxuLy8gSW1wb3J0IHBsdWdpblxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9jbGllbnQnO1xuaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL2NsaWVudCc7XG5pbXBvcnQgcGx1Z2luU3luY0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXN5bmMvY2xpZW50JztcbmltcG9ydCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXBsYXRmb3JtL2NsaWVudCc7XG5cbmltcG9ydCBQbGF5ZXJFeHBlcmllbmNlIGZyb20gJy4vUGxheWVyRXhwZXJpZW5jZS5qcyc7XG5cbmNvbnN0IGNvbmZpZyA9IHdpbmRvdy5zb3VuZHdvcmtzQ29uZmlnO1xuLy8gc3RvcmUgZXhwZXJpZW5jZXMgb2YgZW11bGF0ZWQgY2xpZW50c1xuY29uc3QgZXhwZXJpZW5jZXMgPSBuZXcgU2V0KCk7XG4vLyBpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmNvbnN0IGF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbi8vIGltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgkY29udGFpbmVyLCBpbmRleCkge1xuICB0cnkge1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoKTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyByZWdpc3RlciBwbHVnaW5zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdmaWxlc3lzdGVtJywgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnksIHt9LCBbXSk7XG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInLCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnksIHt9LCBbXSlcbiAgICAvLyBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3Rlcignc3luYycsIHBsdWdpblN5bmNGYWN0b3J5LCB7XG4gICAgLy8gICAvLyBjaG9vc2UgdGhlIGNsb2NrIHRvIHN5bmNocm9uaXplLCBkZWZhdWx0cyB0bzpcbiAgICAvLyAgIC8vICh3aGVyZSBgc3RhcnRUaW1lYCBpcyB0aGUgdGltZSBhdCB3aGljaCB0aGUgcGx1Z2luIGlzIGluc3RhbnRpYXRlZClcbiAgICAvLyAgIGdldFRpbWVGdW5jdGlvbjogKCkgPT4gYXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lLFxuICAgIC8vIH0sIFtdKTtcbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3RlcigncGxhdGZvcm0nLCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnksIHtcbiAgICAgIGZlYXR1cmVzOiBbXG4gICAgICAgIFsnd2ViLWF1ZGlvJywgYXVkaW9Db250ZXh0XSxcbiAgICAgIF1cbiAgICB9LCBbXSk7ICAgXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIGxhdW5jaCBhcHBsaWNhdGlvblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBhd2FpdCBjbGllbnQuaW5pdChjb25maWcpO1xuICAgIGluaXRRb1MoY2xpZW50KTtcblxuICAgIGNvbnN0IGV4cGVyaWVuY2UgPSBuZXcgUGxheWVyRXhwZXJpZW5jZShjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lciwgYXVkaW9Db250ZXh0KTtcbiAgICAvLyBzdG9yZSBleHByaWVuY2UgZm9yIGVtdWxhdGVkIGNsaWVudHNcbiAgICBleHBlcmllbmNlcy5hZGQoZXhwZXJpZW5jZSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcblxuICAgIC8vIHN0YXJ0IGFsbCB0aGUgdGhpbmdzXG4gICAgYXdhaXQgY2xpZW50LnN0YXJ0KCk7XG4gICAgZXhwZXJpZW5jZS5zdGFydCgpO1xuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9IGNhdGNoKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBib290c3RyYXBwaW5nXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdCAkY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI19fc291bmR3b3Jrcy1jb250YWluZXInKTtcbmNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4vLyBlbmFibGUgaW5zdGFuY2lhdGlvbiBvZiBtdWx0aXBsZSBjbGllbnRzIGluIHRoZSBzYW1lIHBhZ2UgdG8gZmFjaWxpdGF0ZVxuLy8gZGV2ZWxvcG1lbnQgYW5kIHRlc3RpbmcgKGJlIGNhcmVmdWwgaW4gcHJvZHVjdGlvbi4uLilcbmNvbnN0IG51bUVtdWxhdGVkQ2xpZW50cyA9IHBhcnNlSW50KHNlYXJjaFBhcmFtcy5nZXQoJ2VtdWxhdGUnKSkgfHwgMTtcblxuLy8gc3BlY2lhbCBsb2dpYyBmb3IgZW11bGF0ZWQgY2xpZW50cyAoMSBjbGljayB0byBydWxlIHRoZW0gYWxsKVxuaWYgKG51bUVtdWxhdGVkQ2xpZW50cyA+IDEpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1FbXVsYXRlZENsaWVudHM7IGkrKykge1xuICAgIGNvbnN0ICRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAkZGl2LmNsYXNzTGlzdC5hZGQoJ2VtdWxhdGUnKTtcbiAgICAkY29udGFpbmVyLmFwcGVuZENoaWxkKCRkaXYpO1xuXG4gICAgbGF1bmNoKCRkaXYsIGkpO1xuICB9XG5cbiAgY29uc3QgJGluaXRQbGF0Zm9ybUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAkaW5pdFBsYXRmb3JtQnRuLmNsYXNzTGlzdC5hZGQoJ2luaXQtcGxhdGZvcm0nKTtcbiAgJGluaXRQbGF0Zm9ybUJ0bi50ZXh0Q29udGVudCA9ICdyZXN1bWUgYWxsJztcblxuICBmdW5jdGlvbiBpbml0UGxhdGZvcm1zKGUpIHtcbiAgICBleHBlcmllbmNlcy5mb3JFYWNoKGV4cGVyaWVuY2UgPT4ge1xuICAgICAgaWYgKGV4cGVyaWVuY2UucGxhdGZvcm0pIHtcbiAgICAgICAgZXhwZXJpZW5jZS5wbGF0Zm9ybS5vblVzZXJHZXN0dXJlKGUpXG4gICAgICB9XG4gICAgfSk7XG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGluaXRQbGF0Zm9ybXMpO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGluaXRQbGF0Zm9ybXMpO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlKCk7XG4gIH1cblxuICAkaW5pdFBsYXRmb3JtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaW5pdFBsYXRmb3Jtcyk7XG4gICRpbml0UGxhdGZvcm1CdG4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGluaXRQbGF0Zm9ybXMpO1xuXG4gICRjb250YWluZXIuYXBwZW5kQ2hpbGQoJGluaXRQbGF0Zm9ybUJ0bik7XG59IGVsc2Uge1xuICBsYXVuY2goJGNvbnRhaW5lciwgMCk7XG59XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFOQTtBQVFBLE1BQU1BLE1BQU0sR0FBR0MsTUFBTSxDQUFDQyxnQkFBdEIsQyxDQUNBOztBQUNBLE1BQU1DLFdBQVcsR0FBRyxJQUFJQyxHQUFKLEVBQXBCLEMsQ0FDQTs7QUFDQSxNQUFNQyxZQUFZLEdBQUcsSUFBSUMsWUFBSixFQUFyQixDLENBQ0E7O0FBRUEsZUFBZUMsTUFBZixDQUFzQkMsVUFBdEIsRUFBa0NDLEtBQWxDLEVBQXlDO0VBQ3ZDLElBQUk7SUFDRixNQUFNQyxNQUFNLEdBQUcsSUFBSUMsY0FBSixFQUFmLENBREUsQ0FHRjtJQUNBO0lBQ0E7O0lBQ0FELE1BQU0sQ0FBQ0UsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIsWUFBOUIsRUFBNENDLGdCQUE1QyxFQUFxRSxFQUFyRSxFQUF5RSxFQUF6RTtJQUNBSixNQUFNLENBQUNFLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLHFCQUE5QixFQUFxREUsZ0JBQXJELEVBQXFGLEVBQXJGLEVBQXlGLEVBQXpGLEVBUEUsQ0FRRjtJQUNBO0lBQ0E7SUFDQTtJQUNBOztJQUNBTCxNQUFNLENBQUNFLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLFVBQTlCLEVBQTBDRyxnQkFBMUMsRUFBaUU7TUFDL0RDLFFBQVEsRUFBRSxDQUNSLENBQUMsV0FBRCxFQUFjWixZQUFkLENBRFE7SUFEcUQsQ0FBakUsRUFJRyxFQUpILEVBYkUsQ0FrQkY7SUFDQTtJQUNBOztJQUNBLE1BQU1LLE1BQU0sQ0FBQ1EsSUFBUCxDQUFZbEIsTUFBWixDQUFOO0lBQ0EsSUFBQW1CLGdCQUFBLEVBQVFULE1BQVI7SUFFQSxNQUFNVSxVQUFVLEdBQUcsSUFBSUMseUJBQUosQ0FBcUJYLE1BQXJCLEVBQTZCVixNQUE3QixFQUFx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