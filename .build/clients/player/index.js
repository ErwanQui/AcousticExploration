"use strict";

require("core-js/stable");

require("regenerator-runtime/runtime");

var _client = require("@soundworks/core/client");

var _initQos = _interopRequireDefault(require("@soundworks/template-helpers/client/init-qos.js"));

var _client2 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/client"));

var _client3 = _interopRequireDefault(require("@soundworks/plugin-filesystem/client"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Import plugin
const config = window.soundworksConfig; // store experiences of emulated clients

const experiences = new Set(); // import path from 'path';
// import fs from 'fs';

async function launch($container, index) {
  try {
    const client = new _client.Client(); // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------

    client.pluginManager.register('filesystem', _client3.default, {}, []);
    client.pluginManager.register('audio-buffer-loader', _client2.default, {}, []); // -------------------------------------------------------------------
    // launch application
    // -------------------------------------------------------------------

    await client.init(config);
    (0, _initQos.default)(client);
    const experience = new _PlayerExperience.default(client, config, $container); // store exprience for emulated clients

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsImluaXQiLCJpbml0UW9TIiwiZXhwZXJpZW5jZSIsIlBsYXllckV4cGVyaWVuY2UiLCJhZGQiLCJkb2N1bWVudCIsImJvZHkiLCJjbGFzc0xpc3QiLCJyZW1vdmUiLCJzdGFydCIsIlByb21pc2UiLCJyZXNvbHZlIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwicXVlcnlTZWxlY3RvciIsInNlYXJjaFBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsImxvY2F0aW9uIiwic2VhcmNoIiwibnVtRW11bGF0ZWRDbGllbnRzIiwicGFyc2VJbnQiLCJnZXQiLCJpIiwiJGRpdiIsImNyZWF0ZUVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsIiRpbml0UGxhdGZvcm1CdG4iLCJ0ZXh0Q29udGVudCIsImluaXRQbGF0Zm9ybXMiLCJlIiwiZm9yRWFjaCIsInBsYXRmb3JtIiwib25Vc2VyR2VzdHVyZSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJhZGRFdmVudExpc3RlbmVyIl0sInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdjb3JlLWpzL3N0YWJsZSc7XG5pbXBvcnQgJ3JlZ2VuZXJhdG9yLXJ1bnRpbWUvcnVudGltZSc7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgaW5pdFFvUyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9pbml0LXFvcy5qcyc7XG5cbi8vIEltcG9ydCBwbHVnaW5cbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvY2xpZW50JztcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9jbGllbnQnO1xuXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG5jb25zdCBjb25maWcgPSB3aW5kb3cuc291bmR3b3Jrc0NvbmZpZztcbi8vIHN0b3JlIGV4cGVyaWVuY2VzIG9mIGVtdWxhdGVkIGNsaWVudHNcbmNvbnN0IGV4cGVyaWVuY2VzID0gbmV3IFNldCgpO1xuLy8gaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIGltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgkY29udGFpbmVyLCBpbmRleCkge1xuICB0cnkge1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoKTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyByZWdpc3RlciBwbHVnaW5zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdmaWxlc3lzdGVtJywgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnksIHt9LCBbXSk7XG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInLCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnksIHt9LCBbXSlcbiAgICBcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gbGF1bmNoIGFwcGxpY2F0aW9uXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGF3YWl0IGNsaWVudC5pbml0KGNvbmZpZyk7XG4gICAgaW5pdFFvUyhjbGllbnQpO1xuXG4gICAgY29uc3QgZXhwZXJpZW5jZSA9IG5ldyBQbGF5ZXJFeHBlcmllbmNlKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgICAvLyBzdG9yZSBleHByaWVuY2UgZm9yIGVtdWxhdGVkIGNsaWVudHNcbiAgICBleHBlcmllbmNlcy5hZGQoZXhwZXJpZW5jZSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcblxuICAgIC8vIHN0YXJ0IGFsbCB0aGUgdGhpbmdzXG4gICAgYXdhaXQgY2xpZW50LnN0YXJ0KCk7XG4gICAgZXhwZXJpZW5jZS5zdGFydCgpO1xuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9IGNhdGNoKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBib290c3RyYXBwaW5nXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdCAkY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI19fc291bmR3b3Jrcy1jb250YWluZXInKTtcbmNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4vLyBlbmFibGUgaW5zdGFuY2lhdGlvbiBvZiBtdWx0aXBsZSBjbGllbnRzIGluIHRoZSBzYW1lIHBhZ2UgdG8gZmFjaWxpdGF0ZVxuLy8gZGV2ZWxvcG1lbnQgYW5kIHRlc3RpbmcgKGJlIGNhcmVmdWwgaW4gcHJvZHVjdGlvbi4uLilcbmNvbnN0IG51bUVtdWxhdGVkQ2xpZW50cyA9IHBhcnNlSW50KHNlYXJjaFBhcmFtcy5nZXQoJ2VtdWxhdGUnKSkgfHwgMTtcblxuLy8gc3BlY2lhbCBsb2dpYyBmb3IgZW11bGF0ZWQgY2xpZW50cyAoMSBjbGljayB0byBydWxlIHRoZW0gYWxsKVxuaWYgKG51bUVtdWxhdGVkQ2xpZW50cyA+IDEpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1FbXVsYXRlZENsaWVudHM7IGkrKykge1xuICAgIGNvbnN0ICRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAkZGl2LmNsYXNzTGlzdC5hZGQoJ2VtdWxhdGUnKTtcbiAgICAkY29udGFpbmVyLmFwcGVuZENoaWxkKCRkaXYpO1xuXG4gICAgbGF1bmNoKCRkaXYsIGkpO1xuICB9XG5cbiAgY29uc3QgJGluaXRQbGF0Zm9ybUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAkaW5pdFBsYXRmb3JtQnRuLmNsYXNzTGlzdC5hZGQoJ2luaXQtcGxhdGZvcm0nKTtcbiAgJGluaXRQbGF0Zm9ybUJ0bi50ZXh0Q29udGVudCA9ICdyZXN1bWUgYWxsJztcblxuICBmdW5jdGlvbiBpbml0UGxhdGZvcm1zKGUpIHtcbiAgICBleHBlcmllbmNlcy5mb3JFYWNoKGV4cGVyaWVuY2UgPT4ge1xuICAgICAgaWYgKGV4cGVyaWVuY2UucGxhdGZvcm0pIHtcbiAgICAgICAgZXhwZXJpZW5jZS5wbGF0Zm9ybS5vblVzZXJHZXN0dXJlKGUpXG4gICAgICB9XG4gICAgfSk7XG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGluaXRQbGF0Zm9ybXMpO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGluaXRQbGF0Zm9ybXMpO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlKCk7XG4gIH1cblxuICAkaW5pdFBsYXRmb3JtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaW5pdFBsYXRmb3Jtcyk7XG4gICRpbml0UGxhdGZvcm1CdG4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGluaXRQbGF0Zm9ybXMpO1xuXG4gICRjb250YWluZXIuYXBwZW5kQ2hpbGQoJGluaXRQbGF0Zm9ybUJ0bik7XG59IGVsc2Uge1xuICBsYXVuY2goJGNvbnRhaW5lciwgMCk7XG59XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBQ0E7O0FBRUE7Ozs7QUFKQTtBQU1BLE1BQU1BLE1BQU0sR0FBR0MsTUFBTSxDQUFDQyxnQkFBdEIsQyxDQUNBOztBQUNBLE1BQU1DLFdBQVcsR0FBRyxJQUFJQyxHQUFKLEVBQXBCLEMsQ0FDQTtBQUVBOztBQUVBLGVBQWVDLE1BQWYsQ0FBc0JDLFVBQXRCLEVBQWtDQyxLQUFsQyxFQUF5QztFQUN2QyxJQUFJO0lBQ0YsTUFBTUMsTUFBTSxHQUFHLElBQUlDLGNBQUosRUFBZixDQURFLENBR0Y7SUFDQTtJQUNBOztJQUNBRCxNQUFNLENBQUNFLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLFlBQTlCLEVBQTRDQyxnQkFBNUMsRUFBcUUsRUFBckUsRUFBeUUsRUFBekU7SUFDQUosTUFBTSxDQUFDRSxhQUFQLENBQXFCQyxRQUFyQixDQUE4QixxQkFBOUIsRUFBcURFLGdCQUFyRCxFQUFxRixFQUFyRixFQUF5RixFQUF6RixFQVBFLENBU0Y7SUFDQTtJQUNBOztJQUNBLE1BQU1MLE1BQU0sQ0FBQ00sSUFBUCxDQUFZZCxNQUFaLENBQU47SUFDQSxJQUFBZSxnQkFBQSxFQUFRUCxNQUFSO0lBRUEsTUFBTVEsVUFBVSxHQUFHLElBQUlDLHlCQUFKLENBQXFCVCxNQUFyQixFQUE2QlIsTUFBN0IsRUFBcUNNLFVBQXJDLENB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