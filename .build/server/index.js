"use strict";

require("source-map-support/register");

var _server = require("@soundworks/core/server");

var _path = _interopRequireDefault(require("path"));

var _serveStatic = _interopRequireDefault(require("serve-static"));

var _templateLiteral = _interopRequireDefault(require("template-literal"));

var _server2 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/server"));

var _server3 = _interopRequireDefault(require("@soundworks/plugin-filesystem/server"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

var _getConfig = _interopRequireDefault(require("./utils/getConfig.js"));

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ENV = process.env.ENV || 'default';
const config = (0, _getConfig.default)(ENV);
const server = new _server.Server(); // html template and static files (in most case, this should not be modified)

server.templateEngine = {
  compile: _templateLiteral.default
};
server.templateDirectory = _path.default.join('.build', 'server', 'tmpl');
server.router.use((0, _serveStatic.default)('public'));
server.router.use('build', (0, _serveStatic.default)(_path.default.join('.build', 'public')));
server.router.use('vendors', (0, _serveStatic.default)(_path.default.join('.vendors', 'public')));
server.router.use('images', (0, _serveStatic.default)(_path.default.join('public', 'images')));
server.router.use('AudioFiles0', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/0_debug_grid')));
server.router.use('AudioFiles1', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/1_binaural_encoded')));
server.router.use('AudioFiles2', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd')));
server.router.use('AudioFiles3', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/3_binaural_rirs')));
server.router.use('AudioFiles4', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/4_ambisonic_rirs_2nd')));
server.router.use('Position', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/assets')));
// import JSON5 from 'json5';
// import path from 'path';
console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`); // const envConfigPath = path.join('public', 'grid_nav_assets', 'assets', `scene.json`)
// var envConfig = JSON5.parse(fs.readFileSync(envConfigPath, 'utf-8'));
// console.log(envConfig)
// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------

server.pluginManager.register('filesystem', _server3.default, {
  directories: [{
    name: 'Position',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/assets'),
    publicDirectory: 'Position'
  }, {
    name: 'AudioFiles0',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/0_debug_grid'),
    publicDirectory: 'AudioFiles0'
  }, {
    name: 'AudioFiles1',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/1_binaural_encoded'),
    publicDirectory: 'public/grid_nav_assets/1_binaural_encoded'
  }, {
    name: 'AudioFiles2',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd'),
    publicDirectory: 'AudioFiles2'
  }, {
    name: 'AudioFiles3',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/3_binaural_rirs'),
    publicDirectory: 'AudioFiles3'
  }, {
    name: 'AudioFiles4',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/4_ambisonic_rirs_2nd'),
    publicDirectory: 'AudioFiles4'
  }]
}, []);
server.pluginManager.register('audio-buffer-loader', _server2.default, {}, []); // -------------------------------------------------------------------
// register schemas
// -------------------------------------------------------------------
// server.stateManager.registerSchema(name, schema);

(async function launch() {
  try {
    // @todo - check how this behaves with a node client...
    await server.init(config, (clientType, config, httpRequest) => {
      return {
        clientType: clientType,
        app: {
          name: config.app.name,
          author: config.app.author
        },
        env: {
          type: config.env.type,
          websockets: config.env.websockets,
          assetsDomain: config.env.assetsDomain
        }
      };
    });
    const playerExperience = new _PlayerExperience.default(server, 'player'); // start all the things

    await server.start();
    playerExperience.start();
  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwibGF1bmNoIiwiaW5pdCIsImNsaWVudFR5cGUiLCJodHRwUmVxdWVzdCIsImF1dGhvciIsInR5cGUiLCJ3ZWJzb2NrZXRzIiwiYXNzZXRzRG9tYWluIiwicGxheWVyRXhwZXJpZW5jZSIsIlBsYXllckV4cGVyaWVuY2UiLCJzdGFydCIsImVyciIsImVycm9yIiwic3RhY2siLCJvbiIsInJlYXNvbiIsInAiXSwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XHJcbmltcG9ydCB7IFNlcnZlciB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvc2VydmVyJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZXJ2ZVN0YXRpYyBmcm9tICdzZXJ2ZS1zdGF0aWMnO1xyXG5pbXBvcnQgY29tcGlsZSBmcm9tICd0ZW1wbGF0ZS1saXRlcmFsJztcclxuXHJcbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvc2VydmVyJztcclxuaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL3NlcnZlcic7XHJcblxyXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xyXG5cclxuaW1wb3J0IGdldENvbmZpZyBmcm9tICcuL3V0aWxzL2dldENvbmZpZy5qcyc7XHJcbmNvbnN0IEVOViA9IHByb2Nlc3MuZW52LkVOViB8fCAnZGVmYXVsdCc7XHJcbmNvbnN0IGNvbmZpZyA9IGdldENvbmZpZyhFTlYpO1xyXG5cclxuY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlcigpO1xyXG5cclxuLy8gaHRtbCB0ZW1wbGF0ZSBhbmQgc3RhdGljIGZpbGVzIChpbiBtb3N0IGNhc2UsIHRoaXMgc2hvdWxkIG5vdCBiZSBtb2RpZmllZClcclxuc2VydmVyLnRlbXBsYXRlRW5naW5lID0geyBjb21waWxlIH07XHJcbnNlcnZlci50ZW1wbGF0ZURpcmVjdG9yeSA9IHBhdGguam9pbignLmJ1aWxkJywgJ3NlcnZlcicsICd0bXBsJyk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKHNlcnZlU3RhdGljKCdwdWJsaWMnKSk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKCdidWlsZCcsIHNlcnZlU3RhdGljKHBhdGguam9pbignLmJ1aWxkJywgJ3B1YmxpYycpKSk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKCd2ZW5kb3JzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcudmVuZG9ycycsICdwdWJsaWMnKSkpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgnaW1hZ2VzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnaW1hZ2VzJykpKTtcclxuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMwJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzBfZGVidWdfZ3JpZCcpKSk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSkpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczInLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnKSkpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvM19iaW5hdXJhbF9yaXJzJykpKTtcclxuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXM0Jywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJykpKTtcclxuc2VydmVyLnJvdXRlci51c2UoJ1Bvc2l0aW9uJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpKSk7XHJcblxyXG5cclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcclxuLy8gaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5jb25zb2xlLmxvZyhgXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi0gbGF1bmNoaW5nIFwiJHtjb25maWcuYXBwLm5hbWV9XCIgaW4gXCIke0VOVn1cIiBlbnZpcm9ubWVudFxyXG4tIFtwaWQ6ICR7cHJvY2Vzcy5waWR9XVxyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5gKTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuLy8gY29uc3QgZW52Q29uZmlnUGF0aCA9IHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cycsICdhc3NldHMnLCBgc2NlbmUuanNvbmApXHJcbi8vIHZhciBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xyXG4vLyBjb25zb2xlLmxvZyhlbnZDb25maWcpXHJcblxyXG5cclxuXHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIHJlZ2lzdGVyIHBsdWdpbnNcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge1xyXG4gIGRpcmVjdG9yaWVzOiBbe1xyXG4gICAgbmFtZTogJ1Bvc2l0aW9uJyxcclxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMnKSxcclxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ1Bvc2l0aW9uJyxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6ICdBdWRpb0ZpbGVzMCcsXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMF9kZWJ1Z19ncmlkJyksXHJcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMCcsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiAnQXVkaW9GaWxlczEnLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZCcpLFxyXG4gICAgcHVibGljRGlyZWN0b3J5OiAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMyJyxcclxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcpLFxyXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczInLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMzJyxcclxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSxcclxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMzJyxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6ICdBdWRpb0ZpbGVzNCcsXHJcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvNF9hbWJpc29uaWNfcmlyc18ybmQnKSxcclxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXM0JyxcclxuICB9XVxyXG59LCBbXSk7XHJcblxyXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tYnVmZmVyLWxvYWRlcicsIHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSwge30sIFtdKTtcclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gcmVnaXN0ZXIgc2NoZW1hc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIHNlcnZlci5zdGF0ZU1hbmFnZXIucmVnaXN0ZXJTY2hlbWEobmFtZSwgc2NoZW1hKTtcclxuXHJcblxyXG4oYXN5bmMgZnVuY3Rpb24gbGF1bmNoKCkge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBAdG9kbyAtIGNoZWNrIGhvdyB0aGlzIGJlaGF2ZXMgd2l0aCBhIG5vZGUgY2xpZW50Li4uXHJcbiAgICBhd2FpdCBzZXJ2ZXIuaW5pdChjb25maWcsIChjbGllbnRUeXBlLCBjb25maWcsIGh0dHBSZXF1ZXN0KSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgY2xpZW50VHlwZTogY2xpZW50VHlwZSxcclxuICAgICAgICBhcHA6IHtcclxuICAgICAgICAgIG5hbWU6IGNvbmZpZy5hcHAubmFtZSxcclxuICAgICAgICAgIGF1dGhvcjogY29uZmlnLmFwcC5hdXRob3IsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnY6IHtcclxuICAgICAgICAgIHR5cGU6IGNvbmZpZy5lbnYudHlwZSxcclxuICAgICAgICAgIHdlYnNvY2tldHM6IGNvbmZpZy5lbnYud2Vic29ja2V0cyxcclxuICAgICAgICAgIGFzc2V0c0RvbWFpbjogY29uZmlnLmVudi5hc3NldHNEb21haW4sXHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcGxheWVyRXhwZXJpZW5jZSA9IG5ldyBQbGF5ZXJFeHBlcmllbmNlKHNlcnZlciwgJ3BsYXllcicpO1xyXG5cclxuICAgIC8vIHN0YXJ0IGFsbCB0aGUgdGhpbmdzXHJcbiAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcclxuICAgIHBsYXllckV4cGVyaWVuY2Uuc3RhcnQoKTtcclxuXHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XHJcbiAgfVxyXG59KSgpO1xyXG5cclxucHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKHJlYXNvbiwgcCkgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCc+IFVuaGFuZGxlZCBQcm9taXNlIFJlamVjdGlvbicpO1xyXG4gIGNvbnNvbGUubG9nKHJlYXNvbik7XHJcbn0pO1xyXG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBcUJBOzs7O0FBcEJBLE1BQU1BLEdBQUcsR0FBR0MsT0FBTyxDQUFDQyxHQUFSLENBQVlGLEdBQVosSUFBbUIsU0FBL0I7QUFDQSxNQUFNRyxNQUFNLEdBQUcsSUFBQUMsa0JBQUEsRUFBVUosR0FBVixDQUFmO0FBRUEsTUFBTUssTUFBTSxHQUFHLElBQUlDLGNBQUosRUFBZixDLENBRUE7O0FBQ0FELE1BQU0sQ0FBQ0UsY0FBUCxHQUF3QjtFQUFFQyxPQUFPLEVBQVBBO0FBQUYsQ0FBeEI7QUFDQUgsTUFBTSxDQUFDSSxpQkFBUCxHQUEyQkMsYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixRQUFwQixFQUE4QixNQUE5QixDQUEzQjtBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixJQUFBQyxvQkFBQSxFQUFZLFFBQVosQ0FBbEI7QUFDQVQsTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsT0FBbEIsRUFBMkIsSUFBQUMsb0JBQUEsRUFBWUosYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixRQUFwQixDQUFaLENBQTNCO0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLFNBQWxCLEVBQTZCLElBQUFDLG9CQUFBLEVBQVlKLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFVBQVYsRUFBc0IsUUFBdEIsQ0FBWixDQUE3QjtBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixRQUFsQixFQUE0QixJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLFFBQXBCLENBQVosQ0FBNUI7QUFDQU4sTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsYUFBbEIsRUFBaUMsSUFBQUMsb0JBQUEsRUFBWUosYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQiw4QkFBcEIsQ0FBWixDQUFqQztBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixhQUFsQixFQUFpQyxJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLG9DQUFwQixDQUFaLENBQWpDO0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLGFBQWxCLEVBQWlDLElBQUFDLG9CQUFBLEVBQVlKLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFFBQVYsRUFBb0IseUNBQXBCLENBQVosQ0FBakM7QUFDQU4sTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsYUFBbEIsRUFBaUMsSUFBQUMsb0JBQUEsRUFBWUosYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixpQ0FBcEIsQ0FBWixDQUFqQztBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixhQUFsQixFQUFpQyxJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLHNDQUFwQixDQUFaLENBQWpDO0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLFVBQWxCLEVBQThCLElBQUFDLG9CQUFBLEVBQVlKLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFFBQVYsRUFBb0Isd0JBQXBCLENBQVosQ0FBOUI7QUFJQTtBQUNBO0FBRUFJLE9BQU8sQ0FBQ0MsR0FBUixDQUFhO0FBQ2I7QUFDQSxlQUFlYixNQUFNLENBQUNjLEdBQVAsQ0FBV0MsSUFBSyxTQUFRbEIsR0FBSTtBQUMzQyxVQUFVQyxPQUFPLENBQUNrQixHQUFJO0FBQ3RCO0FBQ0EsQ0FMQSxFLENBWUE7QUFDQTtBQUNBO0FBS0E7QUFDQTtBQUNBOztBQUVBZCxNQUFNLENBQUNlLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLFlBQTlCLEVBQTRDQyxnQkFBNUMsRUFBcUU7RUFDbkVDLFdBQVcsRUFBRSxDQUFDO0lBQ1pMLElBQUksRUFBRSxVQURNO0lBRVpSLElBQUksRUFBRUEsYUFBQSxDQUFLQyxJQUFMLENBQVVWLE9BQU8sQ0FBQ3VCLEdBQVIsRUFBVixFQUF5QiwrQkFBekIsQ0FGTTtJQUdaQyxlQUFlLEVBQUU7RUFITCxDQUFELEVBS2I7SUFDRVAsSUFBSSxFQUFFLGFBRFI7SUFFRVIsSUFBSSxFQUFFQSxhQUFBLENBQUtDLElBQUwsQ0FBVVYsT0FBTyxDQUFDdUIsR0FBUixFQUFWLEVBQXlCLHFDQUF6QixDQUZSO0lBR0VDLGVBQWUsRUFBRTtFQUhuQixDQUxhLEVBVWI7SUFDRVAsSUFBSSxFQUFFLGFBRFI7SUFFRVIsSUFBSSxFQUFFQSxhQUFBLENBQUtDLElBQUwsQ0FBVVYsT0FBTyxDQUFDdUIsR0FBUixFQUFWLEVBQXlCLDJDQUF6QixDQUZSO0lBR0VDLGVBQWUsRUFBRTtFQUhuQixDQVZhLEVBZWI7SUFDRVAsSUFBSSxFQUFFLGFBRFI7SUFFRVIsSUFBSSxFQUFFQSxhQUFBLENBQUtDLElBQUwsQ0FBVVYsT0FBTyxDQUFDdUIsR0FBUixFQUFWLEVBQXlCLGdEQUF6QixDQUZSO0lBR0VDLGVBQWUsRUFBRTtFQUhuQixDQWZhLEVBb0JiO0lBQ0VQLElBQUksRUFBRSxhQURSO0lBRUVSLElBQUksRUFBRUEsYUFBQSxDQUFLQyxJQUFMLENBQVVWLE9BQU8sQ0FBQ3VCLEdBQVIsRUFBVixFQUF5Qix3Q0FBekIsQ0FGUjtJQUdFQyxlQUFlLEVBQUU7RUFIbkIsQ0FwQmEsRUF5QmI7SUFDRVAsSUFBSSxFQUFFLGFBRFI7SUFFRVIsSUFBSSxFQUFFQSxhQUFBLENBQUtDLElBQUwsQ0FBVVYsT0FBTyxDQUFDdUIsR0FBUixFQUFWLEVBQXlCLDZDQUF6QixDQUZSO0lBR0VDLGVBQWUsRUFBRTtFQUhuQixDQXpCYTtBQURzRCxDQUFyRSxFQStCRyxFQS9CSDtBQWlDQXBCLE1BQU0sQ0FBQ2UsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIscUJBQTlCLEVBQXFESyxnQkFBckQsRUFBcUYsRUFBckYsRUFBeUYsRUFBekYsRSxDQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLENBQUMsZUFBZUMsTUFBZixHQUF3QjtFQUN2QixJQUFJO0lBQ0Y7SUFDQSxNQUFNdEIsTUFBTSxDQUFDdUIsSUFBUCxDQUFZekIsTUFBWixFQUFvQixDQUFDMEIsVUFBRCxFQUFhMUIsTUFBYixFQUFxQjJCLFdBQXJCLEtBQXFDO01BQzdELE9BQU87UUFDTEQsVUFBVSxFQUFFQSxVQURQO1FBRUxaLEdBQUcsRUFBRTtVQUNIQyxJQUFJLEVBQUVmLE1BQU0sQ0FBQ2MsR0FBUCxDQUFXQyxJQURkO1VBRUhhLE1BQU0sRUFBRTVCLE1BQU0sQ0FBQ2MsR0FBUCxDQUFXYztRQUZoQixDQUZBO1FBTUw3QixHQUFHLEVBQUU7VUFDSDhCLElBQUksRUFBRTdCLE1BQU0sQ0FBQ0QsR0FBUCxDQUFXOEIsSUFEZDtVQUVIQyxVQUFVLEVBQUU5QixNQUFNLENBQUNELEdBQVAsQ0FBVytCLFVBRnBCO1VBR0hDLFlBQVksRUFBRS9CLE1BQU0sQ0FBQ0QsR0FBUCxDQUFXZ0M7UUFIdEI7TUFOQSxDQUFQO0lBWUQsQ0FiSyxDQUFOO0lBZUEsTUFBTUMsZ0JBQWdCLEdBQUcsSUFBSUMseUJBQUosQ0FBcUIvQixNQUFyQixFQUE2QixRQUE3QixDQUF6QixDQWpCRSxDQW1CRjs7SUFDQSxNQUFNQSxNQUFNLENBQUNnQyxLQUFQLEVBQU47SUFDQUYsZ0JBQWdCLENBQUNFLEtBQWpCO0VBRUQsQ0F2QkQsQ0F1QkUsT0FBT0MsR0FBUCxFQUFZO0lBQ1p2QixPQUFPLENBQUN3QixLQUFSLENBQWNELEdBQUcsQ0FBQ0UsS0FBbEI7RUFDRDtBQUNGLENBM0JEOztBQTZCQXZDLE9BQU8sQ0FBQ3dDLEVBQVIsQ0FBVyxvQkFBWCxFQUFpQyxDQUFDQyxNQUFELEVBQVNDLENBQVQsS0FBZTtFQUM5QzVCLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLCtCQUFaO0VBQ0FELE9BQU8sQ0FBQ0MsR0FBUixDQUFZMEIsTUFBWjtBQUNELENBSEQifQ==