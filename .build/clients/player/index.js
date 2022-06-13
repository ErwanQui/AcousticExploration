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
    client.pluginManager.register('audio-buffer-loader', _client2.default, {
      data: {
        'steliz_octamic_m02_(ACN-SN3D-2).wav': 'grid_nav_assets/2_ambisonic_encoded_2nd/steliz_octamic_m02_(ACN-SN3D-2)_01-08ch.wav'
      }
    }, []); // client.pluginManager.register('sync', pluginSyncFactory, {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsImRhdGEiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJmZWF0dXJlcyIsImluaXQiLCJpbml0UW9TIiwiZXhwZXJpZW5jZSIsIlBsYXllckV4cGVyaWVuY2UiLCJhZGQiLCJkb2N1bWVudCIsImJvZHkiLCJjbGFzc0xpc3QiLCJyZW1vdmUiLCJzdGFydCIsIlByb21pc2UiLCJyZXNvbHZlIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwicXVlcnlTZWxlY3RvciIsInNlYXJjaFBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsImxvY2F0aW9uIiwic2VhcmNoIiwibnVtRW11bGF0ZWRDbGllbnRzIiwicGFyc2VJbnQiLCJnZXQiLCJpIiwiJGRpdiIsImNyZWF0ZUVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsIiRpbml0UGxhdGZvcm1CdG4iLCJ0ZXh0Q29udGVudCIsImluaXRQbGF0Zm9ybXMiLCJlIiwiZm9yRWFjaCIsInBsYXRmb3JtIiwib25Vc2VyR2VzdHVyZSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJhZGRFdmVudExpc3RlbmVyIl0sInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdjb3JlLWpzL3N0YWJsZSc7XG5pbXBvcnQgJ3JlZ2VuZXJhdG9yLXJ1bnRpbWUvcnVudGltZSc7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgaW5pdFFvUyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9pbml0LXFvcy5qcyc7XG5cbi8vIEltcG9ydCBwbHVnaW5cbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvY2xpZW50JztcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9jbGllbnQnO1xuaW1wb3J0IHBsdWdpblN5bmNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1zeW5jL2NsaWVudCc7XG5pbXBvcnQgcGx1Z2luUGxhdGZvcm1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1wbGF0Zm9ybS9jbGllbnQnO1xuXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG5jb25zdCBjb25maWcgPSB3aW5kb3cuc291bmR3b3Jrc0NvbmZpZztcbi8vIHN0b3JlIGV4cGVyaWVuY2VzIG9mIGVtdWxhdGVkIGNsaWVudHNcbmNvbnN0IGV4cGVyaWVuY2VzID0gbmV3IFNldCgpO1xuLy8gaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5jb25zdCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4vLyBpbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5hc3luYyBmdW5jdGlvbiBsYXVuY2goJGNvbnRhaW5lciwgaW5kZXgpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KCk7XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gcmVnaXN0ZXIgcGx1Z2luc1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3RlcignZmlsZXN5c3RlbScsIHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5LCB7fSwgW10pO1xuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7ICBcbiAgICAgIGRhdGE6IHsnc3RlbGl6X29jdGFtaWNfbTAyXyhBQ04tU04zRC0yKS53YXYnOiAnZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kL3N0ZWxpel9vY3RhbWljX20wMl8oQUNOLVNOM0QtMilfMDEtMDhjaC53YXYnfVxuICAgIH0sIFtdKVxuICAgIC8vIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdzeW5jJywgcGx1Z2luU3luY0ZhY3RvcnksIHtcbiAgICAvLyAgIC8vIGNob29zZSB0aGUgY2xvY2sgdG8gc3luY2hyb25pemUsIGRlZmF1bHRzIHRvOlxuICAgIC8vICAgLy8gKHdoZXJlIGBzdGFydFRpbWVgIGlzIHRoZSB0aW1lIGF0IHdoaWNoIHRoZSBwbHVnaW4gaXMgaW5zdGFudGlhdGVkKVxuICAgIC8vICAgZ2V0VGltZUZ1bmN0aW9uOiAoKSA9PiBhdWRpb0NvbnRleHQuY3VycmVudFRpbWUsXG4gICAgLy8gfSwgW10pO1xuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdwbGF0Zm9ybScsIHBsdWdpblBsYXRmb3JtRmFjdG9yeSwge1xuICAgICAgZmVhdHVyZXM6IFtcbiAgICAgICAgWyd3ZWItYXVkaW8nLCBhdWRpb0NvbnRleHRdLFxuICAgICAgXVxuICAgIH0sIFtdKTsgICBcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gbGF1bmNoIGFwcGxpY2F0aW9uXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGF3YWl0IGNsaWVudC5pbml0KGNvbmZpZyk7XG4gICAgaW5pdFFvUyhjbGllbnQpO1xuXG4gICAgY29uc3QgZXhwZXJpZW5jZSA9IG5ldyBQbGF5ZXJFeHBlcmllbmNlKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyLCBhdWRpb0NvbnRleHQpO1xuICAgIC8vIHN0b3JlIGV4cHJpZW5jZSBmb3IgZW11bGF0ZWQgY2xpZW50c1xuICAgIGV4cGVyaWVuY2VzLmFkZChleHBlcmllbmNlKTtcblxuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuXG4gICAgLy8gc3RhcnQgYWxsIHRoZSB0aGluZ3NcbiAgICBhd2FpdCBjbGllbnQuc3RhcnQoKTtcbiAgICBleHBlcmllbmNlLnN0YXJ0KCk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0gY2F0Y2goZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIGJvb3RzdHJhcHBpbmdcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0ICRjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjX19zb3VuZHdvcmtzLWNvbnRhaW5lcicpO1xuY29uc3Qgc2VhcmNoUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbi8vIGVuYWJsZSBpbnN0YW5jaWF0aW9uIG9mIG11bHRpcGxlIGNsaWVudHMgaW4gdGhlIHNhbWUgcGFnZSB0byBmYWNpbGl0YXRlXG4vLyBkZXZlbG9wbWVudCBhbmQgdGVzdGluZyAoYmUgY2FyZWZ1bCBpbiBwcm9kdWN0aW9uLi4uKVxuY29uc3QgbnVtRW11bGF0ZWRDbGllbnRzID0gcGFyc2VJbnQoc2VhcmNoUGFyYW1zLmdldCgnZW11bGF0ZScpKSB8fCAxO1xuXG4vLyBzcGVjaWFsIGxvZ2ljIGZvciBlbXVsYXRlZCBjbGllbnRzICgxIGNsaWNrIHRvIHJ1bGUgdGhlbSBhbGwpXG5pZiAobnVtRW11bGF0ZWRDbGllbnRzID4gMSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUVtdWxhdGVkQ2xpZW50czsgaSsrKSB7XG4gICAgY29uc3QgJGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICRkaXYuY2xhc3NMaXN0LmFkZCgnZW11bGF0ZScpO1xuICAgICRjb250YWluZXIuYXBwZW5kQ2hpbGQoJGRpdik7XG5cbiAgICBsYXVuY2goJGRpdiwgaSk7XG4gIH1cblxuICBjb25zdCAkaW5pdFBsYXRmb3JtQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICRpbml0UGxhdGZvcm1CdG4uY2xhc3NMaXN0LmFkZCgnaW5pdC1wbGF0Zm9ybScpO1xuICAkaW5pdFBsYXRmb3JtQnRuLnRleHRDb250ZW50ID0gJ3Jlc3VtZSBhbGwnO1xuXG4gIGZ1bmN0aW9uIGluaXRQbGF0Zm9ybXMoZSkge1xuICAgIGV4cGVyaWVuY2VzLmZvckVhY2goZXhwZXJpZW5jZSA9PiB7XG4gICAgICBpZiAoZXhwZXJpZW5jZS5wbGF0Zm9ybSkge1xuICAgICAgICBleHBlcmllbmNlLnBsYXRmb3JtLm9uVXNlckdlc3R1cmUoZSlcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaW5pdFBsYXRmb3Jtcyk7XG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaW5pdFBsYXRmb3Jtcyk7XG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmUoKTtcbiAgfVxuXG4gICRpbml0UGxhdGZvcm1CdG4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBpbml0UGxhdGZvcm1zKTtcbiAgJGluaXRQbGF0Zm9ybUJ0bi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaW5pdFBsYXRmb3Jtcyk7XG5cbiAgJGNvbnRhaW5lci5hcHBlbmRDaGlsZCgkaW5pdFBsYXRmb3JtQnRuKTtcbn0gZWxzZSB7XG4gIGxhdW5jaCgkY29udGFpbmVyLCAwKTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7OztBQU5BO0FBUUEsTUFBTUEsTUFBTSxHQUFHQyxNQUFNLENBQUNDLGdCQUF0QixDLENBQ0E7O0FBQ0EsTUFBTUMsV0FBVyxHQUFHLElBQUlDLEdBQUosRUFBcEIsQyxDQUNBOztBQUNBLE1BQU1DLFlBQVksR0FBRyxJQUFJQyxZQUFKLEVBQXJCLEMsQ0FDQTs7QUFFQSxlQUFlQyxNQUFmLENBQXNCQyxVQUF0QixFQUFrQ0MsS0FBbEMsRUFBeUM7RUFDdkMsSUFBSTtJQUNGLE1BQU1DLE1BQU0sR0FBRyxJQUFJQyxjQUFKLEVBQWYsQ0FERSxDQUdGO0lBQ0E7SUFDQTs7SUFDQUQsTUFBTSxDQUFDRSxhQUFQLENBQXFCQyxRQUFyQixDQUE4QixZQUE5QixFQUE0Q0MsZ0JBQTVDLEVBQXFFLEVBQXJFLEVBQXlFLEVBQXpFO0lBQ0FKLE1BQU0sQ0FBQ0UsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIscUJBQTlCLEVBQXFERSxnQkFBckQsRUFBcUY7TUFDbkZDLElBQUksRUFBRTtRQUFDLHVDQUF1QztNQUF4QztJQUQ2RSxDQUFyRixFQUVHLEVBRkgsRUFQRSxDQVVGO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7O0lBQ0FOLE1BQU0sQ0FBQ0UsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIsVUFBOUIsRUFBMENJLGdCQUExQyxFQUFpRTtNQUMvREMsUUFBUSxFQUFFLENBQ1IsQ0FBQyxXQUFELEVB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