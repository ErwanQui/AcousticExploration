"use strict";

require("core-js/stable");

require("regenerator-runtime/runtime");

var _client = require("@soundworks/core/client");

var _initQos = _interopRequireDefault(require("@soundworks/template-helpers/client/init-qos.js"));

var _client2 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/client"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Import plugin
// import pluginFilesystemFactory from '@soundworks/plugin-filesystem/client';
const config = window.soundworksConfig; // store experiences of emulated clients

const experiences = new Set();

async function launch($container, index) {
  try {
    const client = new _client.Client(); // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------
    // client.pluginManager.register('filesystem', pluginFilesystemFactory, {}, []);

    client.pluginManager.register('audio-buffer-loader', _client2.default, {
      data: {
        'Shoot': 'Audio/Kill.mp3',
        'MonsterSound1': 'Audio/Monster1.mp3',
        'MonsterSound2': 'Audio/Monster2.mp3',
        'MonsterSound3': 'Audio/Monster3.mp3',
        'MonsterSound4': 'Audio/Monster4.mp3',
        'MonsterSound5': 'Audio/Monster5.mp3',
        'MonsterDie': 'Audio/MonsterDie.wav',
        'GameOver': 'Audio/GameOver.wav',
        'PlayerDamage': 'Audio/PlayerDamage.wav'
      }
    }, []); // -------------------------------------------------------------------
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkiLCJkYXRhIiwiaW5pdCIsImluaXRRb1MiLCJleHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsImFkZCIsImRvY3VtZW50IiwiYm9keSIsImNsYXNzTGlzdCIsInJlbW92ZSIsInN0YXJ0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJxdWVyeVNlbGVjdG9yIiwic2VhcmNoUGFyYW1zIiwiVVJMU2VhcmNoUGFyYW1zIiwibG9jYXRpb24iLCJzZWFyY2giLCJudW1FbXVsYXRlZENsaWVudHMiLCJwYXJzZUludCIsImdldCIsImkiLCIkZGl2IiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwiJGluaXRQbGF0Zm9ybUJ0biIsInRleHRDb250ZW50IiwiaW5pdFBsYXRmb3JtcyIsImUiLCJmb3JFYWNoIiwicGxhdGZvcm0iLCJvblVzZXJHZXN0dXJlIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiXSwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ2NvcmUtanMvc3RhYmxlJztcbmltcG9ydCAncmVnZW5lcmF0b3ItcnVudGltZS9ydW50aW1lJztcbmltcG9ydCB7IENsaWVudCB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCBpbml0UW9TIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L2luaXQtcW9zLmpzJztcblxuLy8gSW1wb3J0IHBsdWdpblxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9jbGllbnQnO1xuLy8gaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL2NsaWVudCc7XG5cbmltcG9ydCBQbGF5ZXJFeHBlcmllbmNlIGZyb20gJy4vUGxheWVyRXhwZXJpZW5jZS5qcyc7XG5cbmNvbnN0IGNvbmZpZyA9IHdpbmRvdy5zb3VuZHdvcmtzQ29uZmlnO1xuLy8gc3RvcmUgZXhwZXJpZW5jZXMgb2YgZW11bGF0ZWQgY2xpZW50c1xuY29uc3QgZXhwZXJpZW5jZXMgPSBuZXcgU2V0KCk7XG5cblxuYXN5bmMgZnVuY3Rpb24gbGF1bmNoKCRjb250YWluZXIsIGluZGV4KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IENsaWVudCgpO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIHJlZ2lzdGVyIHBsdWdpbnNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge30sIFtdKTtcbiAgICBjbGllbnQucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tYnVmZmVyLWxvYWRlcicsIHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSwge1xuICAgICAgZGF0YToge1xuICAgICAgICAnU2hvb3QnOiAnQXVkaW8vS2lsbC5tcDMnLFxuICAgICAgICAnTW9uc3RlclNvdW5kMSc6ICdBdWRpby9Nb25zdGVyMS5tcDMnLFxuICAgICAgICAnTW9uc3RlclNvdW5kMic6ICdBdWRpby9Nb25zdGVyMi5tcDMnLFxuICAgICAgICAnTW9uc3RlclNvdW5kMyc6ICdBdWRpby9Nb25zdGVyMy5tcDMnLFxuICAgICAgICAnTW9uc3RlclNvdW5kNCc6ICdBdWRpby9Nb25zdGVyNC5tcDMnLFxuICAgICAgICAnTW9uc3RlclNvdW5kNSc6ICdBdWRpby9Nb25zdGVyNS5tcDMnLFxuICAgICAgICAnTW9uc3RlckRpZSc6ICdBdWRpby9Nb25zdGVyRGllLndhdicsXG4gICAgICAgICdHYW1lT3Zlcic6ICdBdWRpby9HYW1lT3Zlci53YXYnLFxuICAgICAgICAnUGxheWVyRGFtYWdlJzogJ0F1ZGlvL1BsYXllckRhbWFnZS53YXYnLFxuICAgICAgfVxuICAgIH0sIFtdKVxuICAgIFxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBsYXVuY2ggYXBwbGljYXRpb25cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgYXdhaXQgY2xpZW50LmluaXQoY29uZmlnKTtcbiAgICBpbml0UW9TKGNsaWVudCk7XG5cbiAgICBjb25zdCBleHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2UoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICAgIC8vIHN0b3JlIGV4cHJpZW5jZSBmb3IgZW11bGF0ZWQgY2xpZW50c1xuICAgIGV4cGVyaWVuY2VzLmFkZChleHBlcmllbmNlKTtcblxuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuXG4gICAgLy8gc3RhcnQgYWxsIHRoZSB0aGluZ3NcbiAgICBhd2FpdCBjbGllbnQuc3RhcnQoKTtcbiAgICBleHBlcmllbmNlLnN0YXJ0KCk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0gY2F0Y2goZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIGJvb3RzdHJhcHBpbmdcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0ICRjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjX19zb3VuZHdvcmtzLWNvbnRhaW5lcicpO1xuY29uc3Qgc2VhcmNoUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbi8vIGVuYWJsZSBpbnN0YW5jaWF0aW9uIG9mIG11bHRpcGxlIGNsaWVudHMgaW4gdGhlIHNhbWUgcGFnZSB0byBmYWNpbGl0YXRlXG4vLyBkZXZlbG9wbWVudCBhbmQgdGVzdGluZyAoYmUgY2FyZWZ1bCBpbiBwcm9kdWN0aW9uLi4uKVxuY29uc3QgbnVtRW11bGF0ZWRDbGllbnRzID0gcGFyc2VJbnQoc2VhcmNoUGFyYW1zLmdldCgnZW11bGF0ZScpKSB8fCAxO1xuXG4vLyBzcGVjaWFsIGxvZ2ljIGZvciBlbXVsYXRlZCBjbGllbnRzICgxIGNsaWNrIHRvIHJ1bGUgdGhlbSBhbGwpXG5pZiAobnVtRW11bGF0ZWRDbGllbnRzID4gMSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUVtdWxhdGVkQ2xpZW50czsgaSsrKSB7XG4gICAgY29uc3QgJGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICRkaXYuY2xhc3NMaXN0LmFkZCgnZW11bGF0ZScpO1xuICAgICRjb250YWluZXIuYXBwZW5kQ2hpbGQoJGRpdik7XG5cbiAgICBsYXVuY2goJGRpdiwgaSk7XG4gIH1cblxuICBjb25zdCAkaW5pdFBsYXRmb3JtQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICRpbml0UGxhdGZvcm1CdG4uY2xhc3NMaXN0LmFkZCgnaW5pdC1wbGF0Zm9ybScpO1xuICAkaW5pdFBsYXRmb3JtQnRuLnRleHRDb250ZW50ID0gJ3Jlc3VtZSBhbGwnO1xuXG4gIGZ1bmN0aW9uIGluaXRQbGF0Zm9ybXMoZSkge1xuICAgIGV4cGVyaWVuY2VzLmZvckVhY2goZXhwZXJpZW5jZSA9PiB7XG4gICAgICBpZiAoZXhwZXJpZW5jZS5wbGF0Zm9ybSkge1xuICAgICAgICBleHBlcmllbmNlLnBsYXRmb3JtLm9uVXNlckdlc3R1cmUoZSlcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaW5pdFBsYXRmb3Jtcyk7XG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaW5pdFBsYXRmb3Jtcyk7XG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmUoKTtcbiAgfVxuXG4gICRpbml0UGxhdGZvcm1CdG4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBpbml0UGxhdGZvcm1zKTtcbiAgJGluaXRQbGF0Zm9ybUJ0bi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaW5pdFBsYXRmb3Jtcyk7XG5cbiAgJGNvbnRhaW5lci5hcHBlbmRDaGlsZCgkaW5pdFBsYXRmb3JtQnRuKTtcbn0gZWxzZSB7XG4gIGxhdW5jaCgkY29udGFpbmVyLCAwKTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFHQTs7OztBQUpBO0FBRUE7QUFJQSxNQUFNQSxNQUFNLEdBQUdDLE1BQU0sQ0FBQ0MsZ0JBQXRCLEMsQ0FDQTs7QUFDQSxNQUFNQyxXQUFXLEdBQUcsSUFBSUMsR0FBSixFQUFwQjs7QUFHQSxlQUFlQyxNQUFmLENBQXNCQyxVQUF0QixFQUFrQ0MsS0FBbEMsRUFBeUM7RUFDdkMsSUFBSTtJQUNGLE1BQU1DLE1BQU0sR0FBRyxJQUFJQyxj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