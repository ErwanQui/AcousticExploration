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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25maWciLCJ3aW5kb3ciLCJzb3VuZHdvcmtzQ29uZmlnIiwiZXhwZXJpZW5jZXMiLCJTZXQiLCJsYXVuY2giLCIkY29udGFpbmVyIiwiaW5kZXgiLCJjbGllbnQiLCJDbGllbnQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsInBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSIsImluaXQiLCJpbml0UW9TIiwiZXhwZXJpZW5jZSIsIlBsYXllckV4cGVyaWVuY2UiLCJhZGQiLCJkb2N1bWVudCIsImJvZHkiLCJjbGFzc0xpc3QiLCJyZW1vdmUiLCJzdGFydCIsIlByb21pc2UiLCJyZXNvbHZlIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwicXVlcnlTZWxlY3RvciIsInNlYXJjaFBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsImxvY2F0aW9uIiwic2VhcmNoIiwibnVtRW11bGF0ZWRDbGllbnRzIiwicGFyc2VJbnQiLCJnZXQiLCJpIiwiJGRpdiIsImNyZWF0ZUVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsIiRpbml0UGxhdGZvcm1CdG4iLCJ0ZXh0Q29udGVudCIsImluaXRQbGF0Zm9ybXMiLCJlIiwiZm9yRWFjaCIsInBsYXRmb3JtIiwib25Vc2VyR2VzdHVyZSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJhZGRFdmVudExpc3RlbmVyIl0sInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdjb3JlLWpzL3N0YWJsZSc7XHJcbmltcG9ydCAncmVnZW5lcmF0b3ItcnVudGltZS9ydW50aW1lJztcclxuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xyXG5pbXBvcnQgaW5pdFFvUyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9pbml0LXFvcy5qcyc7XHJcblxyXG4vLyBJbXBvcnQgcGx1Z2luXHJcbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvY2xpZW50JztcclxuaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL2NsaWVudCc7XHJcblxyXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xyXG5cclxuY29uc3QgY29uZmlnID0gd2luZG93LnNvdW5kd29ya3NDb25maWc7XHJcbi8vIHN0b3JlIGV4cGVyaWVuY2VzIG9mIGVtdWxhdGVkIGNsaWVudHNcclxuY29uc3QgZXhwZXJpZW5jZXMgPSBuZXcgU2V0KCk7XHJcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuLy8gaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgkY29udGFpbmVyLCBpbmRleCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KCk7XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gcmVnaXN0ZXIgcGx1Z2luc1xyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgY2xpZW50LnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge30sIFtdKTtcclxuICAgIGNsaWVudC5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7fSwgW10pXHJcbiAgICBcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIGxhdW5jaCBhcHBsaWNhdGlvblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgYXdhaXQgY2xpZW50LmluaXQoY29uZmlnKTtcclxuICAgIGluaXRRb1MoY2xpZW50KTtcclxuXHJcbiAgICBjb25zdCBleHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2UoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xyXG4gICAgLy8gc3RvcmUgZXhwcmllbmNlIGZvciBlbXVsYXRlZCBjbGllbnRzXHJcbiAgICBleHBlcmllbmNlcy5hZGQoZXhwZXJpZW5jZSk7XHJcblxyXG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XHJcblxyXG4gICAgLy8gc3RhcnQgYWxsIHRoZSB0aGluZ3NcclxuICAgIGF3YWl0IGNsaWVudC5zdGFydCgpO1xyXG4gICAgZXhwZXJpZW5jZS5zdGFydCgpO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9IGNhdGNoKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBib290c3RyYXBwaW5nXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuY29uc3QgJGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNfX3NvdW5kd29ya3MtY29udGFpbmVyJyk7XHJcbmNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XHJcbi8vIGVuYWJsZSBpbnN0YW5jaWF0aW9uIG9mIG11bHRpcGxlIGNsaWVudHMgaW4gdGhlIHNhbWUgcGFnZSB0byBmYWNpbGl0YXRlXHJcbi8vIGRldmVsb3BtZW50IGFuZCB0ZXN0aW5nIChiZSBjYXJlZnVsIGluIHByb2R1Y3Rpb24uLi4pXHJcbmNvbnN0IG51bUVtdWxhdGVkQ2xpZW50cyA9IHBhcnNlSW50KHNlYXJjaFBhcmFtcy5nZXQoJ2VtdWxhdGUnKSkgfHwgMTtcclxuXHJcbi8vIHNwZWNpYWwgbG9naWMgZm9yIGVtdWxhdGVkIGNsaWVudHMgKDEgY2xpY2sgdG8gcnVsZSB0aGVtIGFsbClcclxuaWYgKG51bUVtdWxhdGVkQ2xpZW50cyA+IDEpIHtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUVtdWxhdGVkQ2xpZW50czsgaSsrKSB7XHJcbiAgICBjb25zdCAkZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAkZGl2LmNsYXNzTGlzdC5hZGQoJ2VtdWxhdGUnKTtcclxuICAgICRjb250YWluZXIuYXBwZW5kQ2hpbGQoJGRpdik7XHJcblxyXG4gICAgbGF1bmNoKCRkaXYsIGkpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgJGluaXRQbGF0Zm9ybUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICRpbml0UGxhdGZvcm1CdG4uY2xhc3NMaXN0LmFkZCgnaW5pdC1wbGF0Zm9ybScpO1xyXG4gICRpbml0UGxhdGZvcm1CdG4udGV4dENvbnRlbnQgPSAncmVzdW1lIGFsbCc7XHJcblxyXG4gIGZ1bmN0aW9uIGluaXRQbGF0Zm9ybXMoZSkge1xyXG4gICAgZXhwZXJpZW5jZXMuZm9yRWFjaChleHBlcmllbmNlID0+IHtcclxuICAgICAgaWYgKGV4cGVyaWVuY2UucGxhdGZvcm0pIHtcclxuICAgICAgICBleHBlcmllbmNlLnBsYXRmb3JtLm9uVXNlckdlc3R1cmUoZSlcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaW5pdFBsYXRmb3Jtcyk7XHJcbiAgICAkaW5pdFBsYXRmb3JtQnRuLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBpbml0UGxhdGZvcm1zKTtcclxuICAgICRpbml0UGxhdGZvcm1CdG4ucmVtb3ZlKCk7XHJcbiAgfVxyXG5cclxuICAkaW5pdFBsYXRmb3JtQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaW5pdFBsYXRmb3Jtcyk7XHJcbiAgJGluaXRQbGF0Zm9ybUJ0bi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaW5pdFBsYXRmb3Jtcyk7XHJcblxyXG4gICRjb250YWluZXIuYXBwZW5kQ2hpbGQoJGluaXRQbGF0Zm9ybUJ0bik7XHJcbn0gZWxzZSB7XHJcbiAgbGF1bmNoKCRjb250YWluZXIsIDApO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFFQTs7OztBQUpBO0FBTUEsTUFBTUEsTUFBTSxHQUFHQyxNQUFNLENBQUNDLGdCQUF0QixDLENBQ0E7O0FBQ0EsTUFBTUMsV0FBVyxHQUFHLElBQUlDLEdBQUosRUFBcEIsQyxDQUNBO0FBRUE7O0FBRUEsZUFBZUMsTUFBZixDQUFzQkMsVUFBdEIsRUFBa0NDLEtBQWxDLEVBQXlDO0VBQ3ZDLElBQUk7SUFDRixNQUFNQyxNQUFNLEdBQUcsSUFBSUMsY0FBSixFQUFmLENBREUsQ0FHRjtJQUNBO0lBQ0E7O0lBQ0FELE1BQU0sQ0FBQ0UsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIsWUFBOUIsRUFBNENDLGdCQUE1QyxFQUFxRSxFQUFyRSxFQUF5RSxFQUF6RTtJQUNBSixNQUFNLENBQUNFLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLHFCQUE5QixFQUFxREUsZ0JBQXJELEVBQXFGLEVB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