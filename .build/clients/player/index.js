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
    client.pluginManager.register('audio-buffer-loader', _client2.default, {}, []);
    client.pluginManager.register('sync', _client4.default, {
      // choose the clock to synchronize, defaults to:
      // (where `startTime` is the time at which the plugin is instantiated)
      getTimeFunction: () => audioContext.currentTime
    }, []);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsInBsdWdpblN5bmNGYWN0b3J5IiwiZ2V0VGltZUZ1bmN0aW9uIiwiY3VycmVudFRpbWUiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJmZWF0dXJlcyIsImluaXQiLCJpbml0UW9TIiwiZXhwZXJpZW5jZSIsIlBsYXllckV4cGVyaWVuY2UiLCJhZGQiLCJkb2N1bWVudCIsImJvZHkiLCJjbGFzc0xpc3QiLCJyZW1vdmUiLCJzdGFydCIsIlByb21pc2UiLCJyZXNvbHZlIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwicXVlcnlTZWxlY3RvciIsInNlYXJjaFBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsImxvY2F0aW9uIiwic2VhcmNoIiwibnVtRW11bGF0ZWRDbGllbnRzIiwicGFyc2VJbnQiLCJnZXQiLCJpIiwiJGRpdiIsImNyZWF0ZUVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsIiRpbml0UGxhdGZvcm1CdG4iLCJ0ZXh0Q29udGVudCIsImluaXRQbGF0Zm9ybXMiLCJlIiwiZm9yRWFjaCIsInBsYXRmb3JtIiwib25Vc2VyR2VzdHVyZSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJhZGRFdmVudExpc3RlbmVyIl0sInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdjb3JlLWpzL3N0YWJsZSc7XG5pbXBvcnQgJ3JlZ2VuZXJhdG9yLXJ1bnRpbWUvcnVudGltZSc7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgaW5pdFFvUyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9pbml0LXFvcy5qcyc7XG5cbi8vIEltcG9ydCBwbHVnaW5cbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvY2xpZW50JztcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9jbGllbnQnO1xuaW1wb3J0IHBsdWdpblN5bmNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1zeW5jL2NsaWVudCc7XG5pbXBvcnQgcGx1Z2luUGxhdGZvcm1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1wbGF0Zm9ybS9jbGllbnQnO1xuXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG5jb25zdCBjb25maWcgPSB3aW5kb3cuc291bmR3b3Jrc0NvbmZpZztcbi8vIHN0b3JlIGV4cGVyaWVuY2VzIG9mIGVtdWxhdGVkIGNsaWVudHNcbmNvbnN0IGV4cGVyaWVuY2VzID0gbmV3IFNldCgpO1xuLy8gaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5jb25zdCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4vLyBpbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5hc3luYyBmdW5jdGlvbiBsYXVuY2goJGNvbnRhaW5lciwgaW5kZXgpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KCk7XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gcmVnaXN0ZXIgcGx1Z2luc1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3RlcignZmlsZXN5c3RlbScsIHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5LCB7fSwgW10pO1xuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7fSwgW10pXG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ3N5bmMnLCBwbHVnaW5TeW5jRmFjdG9yeSwge1xuICAgICAgLy8gY2hvb3NlIHRoZSBjbG9jayB0byBzeW5jaHJvbml6ZSwgZGVmYXVsdHMgdG86XG4gICAgICAvLyAod2hlcmUgYHN0YXJ0VGltZWAgaXMgdGhlIHRpbWUgYXQgd2hpY2ggdGhlIHBsdWdpbiBpcyBpbnN0YW50aWF0ZWQpXG4gICAgICBnZXRUaW1lRnVuY3Rpb246ICgpID0+IGF1ZGlvQ29udGV4dC5jdXJyZW50VGltZSxcbiAgICB9LCBbXSk7XG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ3BsYXRmb3JtJywgcGx1Z2luUGxhdGZvcm1GYWN0b3J5LCB7XG4gICAgICBmZWF0dXJlczogW1xuICAgICAgICBbJ3dlYi1hdWRpbycsIGF1ZGlvQ29udGV4dF0sXG4gICAgICBdXG4gICAgfSwgW10pOyAgIFxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBsYXVuY2ggYXBwbGljYXRpb25cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXdhaXQgY2xpZW50LmluaXQoY29uZmlnKTtcbiAgICBpbml0UW9TKGNsaWVudCk7XG5cbiAgICBjb25zdCBleHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2UoY2xpZW50LCBjb25maWcsICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCk7XG4gICAgLy8gc3RvcmUgZXhwcmllbmNlIGZvciBlbXVsYXRlZCBjbGllbnRzXG4gICAgZXhwZXJpZW5jZXMuYWRkKGV4cGVyaWVuY2UpO1xuXG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG5cbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xuICAgIGF3YWl0IGNsaWVudC5zdGFydCgpO1xuICAgIGV4cGVyaWVuY2Uuc3RhcnQoKTtcblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSBjYXRjaChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gYm9vdHN0cmFwcGluZ1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3QgJGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNfX3NvdW5kd29ya3MtY29udGFpbmVyJyk7XG5jb25zdCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xuLy8gZW5hYmxlIGluc3RhbmNpYXRpb24gb2YgbXVsdGlwbGUgY2xpZW50cyBpbiB0aGUgc2FtZSBwYWdlIHRvIGZhY2lsaXRhdGVcbi8vIGRldmVsb3BtZW50IGFuZCB0ZXN0aW5nIChiZSBjYXJlZnVsIGluIHByb2R1Y3Rpb24uLi4pXG5jb25zdCBudW1FbXVsYXRlZENsaWVudHMgPSBwYXJzZUludChzZWFyY2hQYXJhbXMuZ2V0KCdlbXVsYXRlJykpIHx8IDE7XG5cbi8vIHNwZWNpYWwgbG9naWMgZm9yIGVtdWxhdGVkIGNsaWVudHMgKDEgY2xpY2sgdG8gcnVsZSB0aGVtIGFsbClcbmlmIChudW1FbXVsYXRlZENsaWVudHMgPiAxKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtRW11bGF0ZWRDbGllbnRzOyBpKyspIHtcbiAgICBjb25zdCAkZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgJGRpdi5jbGFzc0xpc3QuYWRkKCdlbXVsYXRlJyk7XG4gICAgJGNvbnRhaW5lci5hcHBlbmRDaGlsZCgkZGl2KTtcblxuICAgIGxhdW5jaCgkZGl2LCBpKTtcbiAgfVxuXG4gIGNvbnN0ICRpbml0UGxhdGZvcm1CdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgJGluaXRQbGF0Zm9ybUJ0bi5jbGFzc0xpc3QuYWRkKCdpbml0LXBsYXRmb3JtJyk7XG4gICRpbml0UGxhdGZvcm1CdG4udGV4dENvbnRlbnQgPSAncmVzdW1lIGFsbCc7XG5cbiAgZnVuY3Rpb24gaW5pdFBsYXRmb3JtcyhlKSB7XG4gICAgZXhwZXJpZW5jZXMuZm9yRWFjaChleHBlcmllbmNlID0+IHtcbiAgICAgIGlmIChleHBlcmllbmNlLnBsYXRmb3JtKSB7XG4gICAgICAgIGV4cGVyaWVuY2UucGxhdGZvcm0ub25Vc2VyR2VzdHVyZShlKVxuICAgICAgfVxuICAgIH0pO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBpbml0UGxhdGZvcm1zKTtcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBpbml0UGxhdGZvcm1zKTtcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZSgpO1xuICB9XG5cbiAgJGluaXRQbGF0Zm9ybUJ0bi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGluaXRQbGF0Zm9ybXMpO1xuICAkaW5pdFBsYXRmb3JtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBpbml0UGxhdGZvcm1zKTtcblxuICAkY29udGFpbmVyLmFwcGVuZENoaWxkKCRpbml0UGxhdGZvcm1CdG4pO1xufSBlbHNlIHtcbiAgbGF1bmNoKCRjb250YWluZXIsIDApO1xufVxuIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBTkE7QUFRQSxNQUFNQSxNQUFNLEdBQUdDLE1BQU0sQ0FBQ0MsZ0JBQXRCLEMsQ0FDQTs7QUFDQSxNQUFNQyxXQUFXLEdBQUcsSUFBSUMsR0FBSixFQUFwQixDLENBQ0E7O0FBQ0EsTUFBTUMsWUFBWSxHQUFHLElBQUlDLFlBQUosRUFBckIsQyxDQUNBOztBQUVBLGVBQWVDLE1BQWYsQ0FBc0JDLFVBQXRCLEVBQWtDQyxLQUFsQyxFQUF5QztFQUN2QyxJQUFJO0lBQ0YsTUFBTUMsTUFBTSxHQUFHLElBQUlDLGNBQUosRUFBZixDQURFLENBR0Y7SUFDQTtJQUNBOztJQUNBRCxNQUFNLENBQUNFLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLFlBQTlCLEVBQTRDQyxnQkFBNUMsRUFBcUUsRUFBckUsRUFBeUUsRUFBekU7SUFDQUosTUFBTSxDQUFDRSxhQUFQLENBQXFCQyxRQUFyQixDQUE4QixxQkFBOUIsRUFBcURFLGdCQUFyRCxFQUFxRixFQUFyRixFQUF5RixFQUF6RjtJQUNBTCxNQUFNLENBQUNFLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLE1BQTlCLEVBQXNDRyxnQkFBdEMsRUFBeUQ7TUFDdkQ7TUFDQTtNQUNBQyxlQUFlLEVBQUUsTUFBTVosWUFBWSxDQUFDYTtJQUhtQixDQUF6RCxFQUlHLEVBSkg7SUFLQVIsTUFBTSxDQUFDRSxhQUFQLENBQXFCQyxRQUFyQixDQUE4QixVQUE5QixFQUEwQ00sZ0JBQTFDLEVBQWlFO01BQy9EQyxRQUFRLEVBQUUsQ0FDUixDQUFDLFdBQUQsRUFBY2YsWUFBZCxDQURRO0lBRHFELENBQWpFLEVBSUcsRUFKSCxFQWJFLENBa0JGO0lBQ0E7SUFDQTs7SUFDQSxNQUFNSyxNQUFNLENBQUNXLElBQVAsQ0FBWXJCLE1BQVosQ0FBTjtJQUNBLElBQUFzQixnQkFBQSxFQUFRWixNQUFSO0lBRUEsTUFBTWEsVUFBVSxHQUFHLElBQUlDLHlCQUFKLENBQXFCZCxNQUFyQixFQUE2QlYsTUFBN0IsRUFBcUNRLFVBQXJDLEVBQWlESCxZQUFqRCxDQUFuQixDQXhCRSxDQXlCRjs7SUFDQUYsV0FBVyxDQUFDc0IsR0FBWixDQUFnQkYsVUFBaEI7SUFFQUcsUUFBUSxDQUFDQyxJQUFULENBQWNDLFNBQWQsQ0FBd0JDLE1BQXhCLENBQStCLFNBQS9CLEVBNUJFLENBOEJGOztJQUNBLE1BQU1uQixNQUFNLENBQUNvQixLQUFQLEVBQU47SUFDQVAsVUFBVSxDQUFDTyxLQUFYO0lBRUEsT0FBT0MsT0FBTyxDQUFDQyxPQUFSLEVBQVA7RUFDRCxDQW5DRCxDQW1DRSxPQUFNQyxHQUFOLEVBQVc7SUFDWEMsT0FBTyxDQUFDQyxLQUFSLENBQWNGLEdBQWQ7RUFDRDtBQUNGLEMsQ0FFRDtBQUNBO0FBQ0E7OztBQUNBLE1BQU16QixVQUFVLEdBQUdrQixRQUFRLENBQUNVLGFBQVQsQ0FBdUIseUJBQXZCLENBQW5CO0FBQ0EsTUFBTUMsWUFBWSxHQUFHLElBQUlDLGVBQUosQ0FBb0JyQyxNQUFNLENBQUNzQyxRQUFQLENBQWdCQyxNQUFwQyxDQUFyQixDLENBQ0E7QUFDQTs7QUFDQSxNQUFNQyxrQkFBa0IsR0FBR0MsUUFBUSxDQUFDTCxZQUFZLENBQUNNLEdBQWIsQ0FBaUIsU0FBakIsQ0FBRCxDQUFSLElBQXlDLENBQXBFLEMsQ0FFQTs7QUFDQSxJQUFJRixrQkFBa0IsR0FBRyxDQUF6QixFQUE0QjtFQUMxQixLQUFLLElBQUlHLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdILGtCQUFwQixFQUF3Q0csQ0FBQyxFQUF6QyxFQUE2QztJQUMzQyxNQUFNQyxJQUFJLEdBQUduQixRQUFRLENBQUNvQixhQUFULENBQXVCLEtBQXZCLENBQWI7SUFDQUQsSUFBSSxDQUFDakIsU0FBTCxDQUFlSCxHQUFmLENBQW1CLFNBQW5CO0lBQ0FqQixVQUFVLENBQUN1QyxXQUFYLENBQXVCRixJQUF2QjtJQUVBdEMsTUFBTSxDQUFDc0MsSUFBRCxFQUFPRCxDQUFQLENBQU47RUFDRDs7RUFFRCxNQUFNSSxnQkFBZ0IsR0FBR3RCLFFBQVEsQ0FBQ29CLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBekI7RUFDQUUsZ0JBQWdCLENBQUNwQixTQUFqQixDQUEyQkgsR0FBM0IsQ0FBK0IsZUFBL0I7RUFDQXVCLGdCQUFnQixDQUFDQyxXQUFqQixHQUErQixZQUEvQjs7RUFFQSxTQUFTQyxhQUFULENBQXVCQyxDQUF2QixFQUEwQjtJQUN4QmhELFdBQVcsQ0FBQ2lELE9BQVosQ0FBb0I3QixVQUFVLElBQUk7TUFDaEMsSUFBSUEsVUFBVSxDQUFDOEIsUUFBZixFQUF5QjtRQUN2QjlCLFVBQVUsQ0FBQzhCLFFBQVgsQ0FBb0JDLGFBQXBCLENBQWtDSCxDQUFsQztNQUNEO0lBQ0YsQ0FKRDtJQUtBSCxnQkFBZ0IsQ0FBQ08sbUJBQWpCLENBQXFDLFVBQXJDLEVBQWlETCxhQUFqRDtJQUNBRixnQkFBZ0IsQ0FBQ08sbUJBQWpCLENBQXFDLFNBQXJDLEVBQWdETCxhQUFoRDtJQUNBRixnQkFBZ0IsQ0FBQ25CLE1BQWpCO0VBQ0Q7O0VBRURtQixnQkFBZ0IsQ0FBQ1EsZ0JBQWpCLENBQWtDLFVBQWxDLEVBQThDTixhQUE5QztFQUNBRixnQkFBZ0IsQ0FBQ1EsZ0JBQWpCLENBQWtDLFNBQWxDLEVBQTZDTixhQUE3QztFQUVBMUMsVUFBVSxDQUFDdUMsV0FBWCxDQUF1QkMsZ0JBQXZCO0FBQ0QsQ0E1QkQsTUE0Qk87RUFDTHpDLE1BQU0sQ0FBQ0MsVUFBRCxFQUFhLENBQWIsQ0FBTjtBQUNEIn0=