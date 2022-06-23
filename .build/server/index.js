"use strict";

require("source-map-support/register");

var _server = require("@soundworks/core/server");

var _path = _interopRequireDefault(require("path"));

var _serveStatic = _interopRequireDefault(require("serve-static"));

var _templateLiteral = _interopRequireDefault(require("template-literal"));

var _server2 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/server"));

var _server3 = _interopRequireDefault(require("@soundworks/plugin-filesystem/server"));

var _server4 = _interopRequireDefault(require("@soundworks/plugin-sync/server"));

var _server5 = _interopRequireDefault(require("@soundworks/plugin-platform/server"));

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
server.router.use('AudioFilesPiano', (0, _serveStatic.default)(_path.default.join('public', 'piano')));
server.router.use('Assets', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/assets')));
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
    name: 'Assets',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/assets'),
    publicDirectory: 'Assets'
  }, {
    name: 'AudioFiles0',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/0_debug_grid'),
    publicDirectory: 'AudioFiles0'
  }, {
    name: 'AudioFiles1',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/1_binaural_encoded'),
    publicDirectory: 'AudioFiles1'
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
  }, {
    name: 'AudioFilesPiano',
    path: _path.default.join(process.cwd(), 'public/piano'),
    publicDirectory: 'AudioFilesPiano'
  }]
}, []);
server.pluginManager.register('audio-buffer-loader', _server2.default, {}, []);
server.pluginManager.register('sync', _server4.default, {}, []);
server.pluginManager.register('platform', _server5.default, {}, []); // -------------------------------------------------------------------
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwicGx1Z2luU3luY0ZhY3RvcnkiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJsYXVuY2giLCJpbml0IiwiY2xpZW50VHlwZSIsImh0dHBSZXF1ZXN0IiwiYXV0aG9yIiwidHlwZSIsIndlYnNvY2tldHMiLCJhc3NldHNEb21haW4iLCJwbGF5ZXJFeHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsInN0YXJ0IiwiZXJyIiwiZXJyb3IiLCJzdGFjayIsIm9uIiwicmVhc29uIiwicCJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCB7IFNlcnZlciB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvc2VydmVyJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHNlcnZlU3RhdGljIGZyb20gJ3NlcnZlLXN0YXRpYyc7XG5pbXBvcnQgY29tcGlsZSBmcm9tICd0ZW1wbGF0ZS1saXRlcmFsJztcblxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luU3luY0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXN5bmMvc2VydmVyJztcbmltcG9ydCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXBsYXRmb3JtL3NlcnZlcic7XG5cbmltcG9ydCBQbGF5ZXJFeHBlcmllbmNlIGZyb20gJy4vUGxheWVyRXhwZXJpZW5jZS5qcyc7XG5cbmltcG9ydCBnZXRDb25maWcgZnJvbSAnLi91dGlscy9nZXRDb25maWcuanMnO1xuY29uc3QgRU5WID0gcHJvY2Vzcy5lbnYuRU5WIHx8ICdkZWZhdWx0JztcbmNvbnN0IGNvbmZpZyA9IGdldENvbmZpZyhFTlYpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKCk7XG5cbi8vIGh0bWwgdGVtcGxhdGUgYW5kIHN0YXRpYyBmaWxlcyAoaW4gbW9zdCBjYXNlLCB0aGlzIHNob3VsZCBub3QgYmUgbW9kaWZpZWQpXG5zZXJ2ZXIudGVtcGxhdGVFbmdpbmUgPSB7IGNvbXBpbGUgfTtcbnNlcnZlci50ZW1wbGF0ZURpcmVjdG9yeSA9IHBhdGguam9pbignLmJ1aWxkJywgJ3NlcnZlcicsICd0bXBsJyk7XG5zZXJ2ZXIucm91dGVyLnVzZShzZXJ2ZVN0YXRpYygncHVibGljJykpO1xuc2VydmVyLnJvdXRlci51c2UoJ2J1aWxkJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcuYnVpbGQnLCAncHVibGljJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCd2ZW5kb3JzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcudmVuZG9ycycsICdwdWJsaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ2ltYWdlcycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2ltYWdlcycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczAnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMF9kZWJ1Z19ncmlkJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMyJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXM0Jywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzUGlhbm8nLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdwaWFubycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXNzZXRzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpKSk7XG5cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbi8vIGltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XG4vLyBpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc29sZS5sb2coYFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi0gbGF1bmNoaW5nIFwiJHtjb25maWcuYXBwLm5hbWV9XCIgaW4gXCIke0VOVn1cIiBlbnZpcm9ubWVudFxuLSBbcGlkOiAke3Byb2Nlc3MucGlkfV1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5gKTtcblxuLy8gY29uc3QgZW52Q29uZmlnUGF0aCA9IHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cycsICdhc3NldHMnLCBgc2NlbmUuanNvbmApXG4vLyB2YXIgZW52Q29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGVudkNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbi8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgcGx1Z2luc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignZmlsZXN5c3RlbScsIHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5LCB7XG4gIGRpcmVjdG9yaWVzOiBbe1xuICAgIG5hbWU6ICdBc3NldHMnLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBc3NldHMnLFxuICB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMwJyxcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMF9kZWJ1Z19ncmlkJyksXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczAnLFxuICB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMxJyxcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkJyksXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczEnLFxuICB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMyJyxcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMicsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQXVkaW9GaWxlczMnLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMycsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQXVkaW9GaWxlczQnLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy80X2FtYmlzb25pY19yaXJzXzJuZCcpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXM0JyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdBdWRpb0ZpbGVzUGlhbm8nLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL3BpYW5vJyksXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlc1BpYW5vJyxcbiAgfV1cbn0sIFtdKTtcblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInLCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnksIHt9LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdzeW5jJywgcGx1Z2luU3luY0ZhY3RvcnksIHt9LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdwbGF0Zm9ybScsIHBsdWdpblBsYXRmb3JtRmFjdG9yeSwge30sIFtdKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgc2NoZW1hc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gc2VydmVyLnN0YXRlTWFuYWdlci5yZWdpc3RlclNjaGVtYShuYW1lLCBzY2hlbWEpO1xuXG5cbihhc3luYyBmdW5jdGlvbiBsYXVuY2goKSB7XG4gIHRyeSB7XG4gICAgLy8gQHRvZG8gLSBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdpdGggYSBub2RlIGNsaWVudC4uLlxuICAgIGF3YWl0IHNlcnZlci5pbml0KGNvbmZpZywgKGNsaWVudFR5cGUsIGNvbmZpZywgaHR0cFJlcXVlc3QpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsaWVudFR5cGU6IGNsaWVudFR5cGUsXG4gICAgICAgIGFwcDoge1xuICAgICAgICAgIG5hbWU6IGNvbmZpZy5hcHAubmFtZSxcbiAgICAgICAgICBhdXRob3I6IGNvbmZpZy5hcHAuYXV0aG9yLFxuICAgICAgICB9LFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICB0eXBlOiBjb25maWcuZW52LnR5cGUsXG4gICAgICAgICAgd2Vic29ja2V0czogY29uZmlnLmVudi53ZWJzb2NrZXRzLFxuICAgICAgICAgIGFzc2V0c0RvbWFpbjogY29uZmlnLmVudi5hc3NldHNEb21haW4sXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGF5ZXJFeHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2Uoc2VydmVyLCAncGxheWVyJyk7XG5cbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xuICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgIHBsYXllckV4cGVyaWVuY2Uuc3RhcnQoKTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gIH1cbn0pKCk7XG5cbnByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24sIHApID0+IHtcbiAgY29uc29sZS5sb2coJz4gVW5oYW5kbGVkIFByb21pc2UgUmVqZWN0aW9uJyk7XG4gIGNvbnNvbGUubG9nKHJlYXNvbik7XG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFzQkE7Ozs7QUFyQkEsTUFBTUEsR0FBRyxHQUFHQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUYsR0FBWixJQUFtQixTQUEvQjtBQUNBLE1BQU1HLE1BQU0sR0FBRyxJQUFBQyxrQkFBQSxFQUFVSixHQUFWLENBQWY7QUFFQSxNQUFNSyxNQUFNLEdBQUcsSUFBSUMsY0FBSixFQUFmLEMsQ0FFQTs7QUFDQUQsTUFBTSxDQUFDRSxjQUFQLEdBQXdCO0VBQUVDLE9BQU8sRUFBUEE7QUFBRixDQUF4QjtBQUNBSCxNQUFNLENBQUNJLGlCQUFQLEdBQTJCQyxhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLFFBQXBCLEVBQThCLE1BQTlCLENBQTNCO0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLElBQUFDLG9CQUFBLEVBQVksUUFBWixDQUFsQjtBQUNBVCxNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixPQUFsQixFQUEyQixJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLFFBQXBCLENBQVosQ0FBM0I7QUFDQU4sTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsU0FBbEIsRUFBNkIsSUFBQUMsb0JBQUEsRUFBWUosYUFBQSxDQUFLQyxJQUFMLENBQVUsVUFBVixFQUFzQixRQUF0QixDQUFaLENBQTdCO0FBQ0FO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