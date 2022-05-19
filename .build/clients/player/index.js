"use strict";

require("core-js/stable");

require("regenerator-runtime/runtime");

var _client = require("@soundworks/core/client");

var _initQos = _interopRequireDefault(require("@soundworks/template-helpers/client/init-qos.js"));

var _client2 = _interopRequireDefault(require("@soundworks/plugin-filesystem/client"));

var _client3 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/client"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import pluginAudioBufferLoaderFactory from '@soundworks/plugin-audio-buffer-loader/client';
// Import plugin
const config = window.soundworksConfig; // store experiences of emulated clients

const experiences = new Set();

async function launch($container, index) {
  try {
    const client = new _client.Client(); // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------

    client.pluginManager.register('filesystem', _client2.default, {}, []);
    client.pluginManager.register('audio-buffer-loader', _client3.default, {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsImRhdGEiLCJpbml0IiwiaW5pdFFvUyIsImV4cGVyaWVuY2UiLCJQbGF5ZXJFeHBlcmllbmNlIiwiYWRkIiwiZG9jdW1lbnQiLCJib2R5IiwiY2xhc3NMaXN0IiwicmVtb3ZlIiwic3RhcnQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsInF1ZXJ5U2VsZWN0b3IiLCJzZWFyY2hQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJsb2NhdGlvbiIsInNlYXJjaCIsIm51bUVtdWxhdGVkQ2xpZW50cyIsInBhcnNlSW50IiwiZ2V0IiwiaSIsIiRkaXYiLCJjcmVhdGVFbGVtZW50IiwiYXBwZW5kQ2hpbGQiLCIkaW5pdFBsYXRmb3JtQnRuIiwidGV4dENvbnRlbnQiLCJpbml0UGxhdGZvcm1zIiwiZSIsImZvckVhY2giLCJwbGF0Zm9ybSIsIm9uVXNlckdlc3R1cmUiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiYWRkRXZlbnRMaXN0ZW5lciJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnY29yZS1qcy9zdGFibGUnO1xuaW1wb3J0ICdyZWdlbmVyYXRvci1ydW50aW1lL3J1bnRpbWUnO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IGluaXRRb1MgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvaW5pdC1xb3MuanMnO1xuXG5pbXBvcnQgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWZpbGVzeXN0ZW0vY2xpZW50Jztcbi8vIGltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvY2xpZW50JztcblxuLy8gSW1wb3J0IHBsdWdpblxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9jbGllbnQnO1xuXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG5jb25zdCBjb25maWcgPSB3aW5kb3cuc291bmR3b3Jrc0NvbmZpZztcbi8vIHN0b3JlIGV4cGVyaWVuY2VzIG9mIGVtdWxhdGVkIGNsaWVudHNcbmNvbnN0IGV4cGVyaWVuY2VzID0gbmV3IFNldCgpO1xuXG5cbmFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgkY29udGFpbmVyLCBpbmRleCkge1xuICB0cnkge1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoKTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyByZWdpc3RlciBwbHVnaW5zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdmaWxlc3lzdGVtJywgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnksIHt9LCBbXSk7XG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInLCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnksIHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgJ1Nob290JzogJ0F1ZGlvL0tpbGwubXAzJyxcbiAgICAgICAgJ01vbnN0ZXJTb3VuZDEnOiAnQXVkaW8vTW9uc3RlcjEubXAzJyxcbiAgICAgICAgJ01vbnN0ZXJTb3VuZDInOiAnQXVkaW8vTW9uc3RlcjIubXAzJyxcbiAgICAgICAgJ01vbnN0ZXJTb3VuZDMnOiAnQXVkaW8vTW9uc3RlcjMubXAzJyxcbiAgICAgICAgJ01vbnN0ZXJTb3VuZDQnOiAnQXVkaW8vTW9uc3RlcjQubXAzJyxcbiAgICAgICAgJ01vbnN0ZXJTb3VuZDUnOiAnQXVkaW8vTW9uc3RlcjUubXAzJyxcbiAgICAgICAgJ01vbnN0ZXJEaWUnOiAnQXVkaW8vTW9uc3RlckRpZS53YXYnLFxuICAgICAgICAnR2FtZU92ZXInOiAnQXVkaW8vR2FtZU92ZXIud2F2JyxcbiAgICAgICAgJ1BsYXllckRhbWFnZSc6ICdBdWRpby9QbGF5ZXJEYW1hZ2Uud2F2JyxcbiAgICAgIH1cbiAgICB9LCBbXSlcbiAgICBcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gbGF1bmNoIGFwcGxpY2F0aW9uXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGF3YWl0IGNsaWVudC5pbml0KGNvbmZpZyk7XG4gICAgaW5pdFFvUyhjbGllbnQpO1xuXG4gICAgY29uc3QgZXhwZXJpZW5jZSA9IG5ldyBQbGF5ZXJFeHBlcmllbmNlKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgICAvLyBzdG9yZSBleHByaWVuY2UgZm9yIGVtdWxhdGVkIGNsaWVudHNcbiAgICBleHBlcmllbmNlcy5hZGQoZXhwZXJpZW5jZSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcblxuICAgIC8vIHN0YXJ0IGFsbCB0aGUgdGhpbmdzXG4gICAgYXdhaXQgY2xpZW50LnN0YXJ0KCk7XG4gICAgZXhwZXJpZW5jZS5zdGFydCgpO1xuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9IGNhdGNoKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBib290c3RyYXBwaW5nXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdCAkY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI19fc291bmR3b3Jrcy1jb250YWluZXInKTtcbmNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4vLyBlbmFibGUgaW5zdGFuY2lhdGlvbiBvZiBtdWx0aXBsZSBjbGllbnRzIGluIHRoZSBzYW1lIHBhZ2UgdG8gZmFjaWxpdGF0ZVxuLy8gZGV2ZWxvcG1lbnQgYW5kIHRlc3RpbmcgKGJlIGNhcmVmdWwgaW4gcHJvZHVjdGlvbi4uLilcbmNvbnN0IG51bUVtdWxhdGVkQ2xpZW50cyA9IHBhcnNlSW50KHNlYXJjaFBhcmFtcy5nZXQoJ2VtdWxhdGUnKSkgfHwgMTtcblxuLy8gc3BlY2lhbCBsb2dpYyBmb3IgZW11bGF0ZWQgY2xpZW50cyAoMSBjbGljayB0byBydWxlIHRoZW0gYWxsKVxuaWYgKG51bUVtdWxhdGVkQ2xpZW50cyA+IDEpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1FbXVsYXRlZENsaWVudHM7IGkrKykge1xuICAgIGNvbnN0ICRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAkZGl2LmNsYXNzTGlzdC5hZGQoJ2VtdWxhdGUnKTtcbiAgICAkY29udGFpbmVyLmFwcGVuZENoaWxkKCRkaXYpO1xuXG4gICAgbGF1bmNoKCRkaXYsIGkpO1xuICB9XG5cbiAgY29uc3QgJGluaXRQbGF0Zm9ybUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAkaW5pdFBsYXRmb3JtQnRuLmNsYXNzTGlzdC5hZGQoJ2luaXQtcGxhdGZvcm0nKTtcbiAgJGluaXRQbGF0Zm9ybUJ0bi50ZXh0Q29udGVudCA9ICdyZXN1bWUgYWxsJztcblxuICBmdW5jdGlvbiBpbml0UGxhdGZvcm1zKGUpIHtcbiAgICBleHBlcmllbmNlcy5mb3JFYWNoKGV4cGVyaWVuY2UgPT4ge1xuICAgICAgaWYgKGV4cGVyaWVuY2UucGxhdGZvcm0pIHtcbiAgICAgICAgZXhwZXJpZW5jZS5wbGF0Zm9ybS5vblVzZXJHZXN0dXJlKGUpXG4gICAgICB9XG4gICAgfSk7XG4gICAgJGluaXRQbGF0Zm9ybUJ0bi5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGluaXRQbGF0Zm9ybXMpO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGluaXRQbGF0Zm9ybXMpO1xuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlKCk7XG4gIH1cblxuICAkaW5pdFBsYXRmb3JtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaW5pdFBsYXRmb3Jtcyk7XG4gICRpbml0UGxhdGZvcm1CdG4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGluaXRQbGF0Zm9ybXMpO1xuXG4gICRjb250YWluZXIuYXBwZW5kQ2hpbGQoJGluaXRQbGF0Zm9ybUJ0bik7XG59IGVsc2Uge1xuICBsYXVuY2goJGNvbnRhaW5lciwgMCk7XG59XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBSUE7O0FBRUE7Ozs7QUFMQTtBQUVBO0FBS0EsTUFBTUEsTUFBTSxHQUFHQyxNQUFNLENBQUNDLGdCQUF0QixDLENBQ0E7O0FB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