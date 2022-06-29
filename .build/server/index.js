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

var _server6 = _interopRequireDefault(require("@soundworks/plugin-audio-streams/server"));

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
server.router.use('/public/piano', (0, _serveStatic.default)(_path.default.join('public', 'piano')));
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
server.pluginManager.register('audio-streams', _server6.default, {
  directory: 'public/piano',
  cache: true
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSIsImRpcmVjdG9yeSIsImNhY2hlIiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwicGx1Z2luU3luY0ZhY3RvcnkiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJsYXVuY2giLCJpbml0IiwiY2xpZW50VHlwZSIsImh0dHBSZXF1ZXN0IiwiYXV0aG9yIiwidHlwZSIsIndlYnNvY2tldHMiLCJhc3NldHNEb21haW4iLCJwbGF5ZXJFeHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsInN0YXJ0IiwiZXJyIiwiZXJyb3IiLCJzdGFjayIsIm9uIiwicmVhc29uIiwicCJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCB7IFNlcnZlciB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvc2VydmVyJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHNlcnZlU3RhdGljIGZyb20gJ3NlcnZlLXN0YXRpYyc7XG5pbXBvcnQgY29tcGlsZSBmcm9tICd0ZW1wbGF0ZS1saXRlcmFsJztcblxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luU3luY0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXN5bmMvc2VydmVyJztcbmltcG9ydCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXBsYXRmb3JtL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tc3RyZWFtcy9zZXJ2ZXInO1xuXG5cbmltcG9ydCBQbGF5ZXJFeHBlcmllbmNlIGZyb20gJy4vUGxheWVyRXhwZXJpZW5jZS5qcyc7XG5cbmltcG9ydCBnZXRDb25maWcgZnJvbSAnLi91dGlscy9nZXRDb25maWcuanMnO1xuY29uc3QgRU5WID0gcHJvY2Vzcy5lbnYuRU5WIHx8ICdkZWZhdWx0JztcbmNvbnN0IGNvbmZpZyA9IGdldENvbmZpZyhFTlYpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKCk7XG5cbi8vIGh0bWwgdGVtcGxhdGUgYW5kIHN0YXRpYyBmaWxlcyAoaW4gbW9zdCBjYXNlLCB0aGlzIHNob3VsZCBub3QgYmUgbW9kaWZpZWQpXG5zZXJ2ZXIudGVtcGxhdGVFbmdpbmUgPSB7IGNvbXBpbGUgfTtcbnNlcnZlci50ZW1wbGF0ZURpcmVjdG9yeSA9IHBhdGguam9pbignLmJ1aWxkJywgJ3NlcnZlcicsICd0bXBsJyk7XG5zZXJ2ZXIucm91dGVyLnVzZShzZXJ2ZVN0YXRpYygncHVibGljJykpO1xuc2VydmVyLnJvdXRlci51c2UoJ2J1aWxkJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcuYnVpbGQnLCAncHVibGljJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCd2ZW5kb3JzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcudmVuZG9ycycsICdwdWJsaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ2ltYWdlcycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2ltYWdlcycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczAnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMF9kZWJ1Z19ncmlkJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMyJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXM0Jywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzUGlhbm8nLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdwaWFubycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXNzZXRzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnL3B1YmxpYy9waWFubycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ3BpYW5vJykpKTtcblxuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241Jztcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zb2xlLmxvZyhgXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLSBsYXVuY2hpbmcgXCIke2NvbmZpZy5hcHAubmFtZX1cIiBpbiBcIiR7RU5WfVwiIGVudmlyb25tZW50XG4tIFtwaWQ6ICR7cHJvY2Vzcy5waWR9XVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmApO1xuXG4vLyBjb25zdCBlbnZDb25maWdQYXRoID0gcGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzJywgJ2Fzc2V0cycsIGBzY2VuZS5qc29uYClcbi8vIHZhciBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyByZWdpc3RlciBwbHVnaW5zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdmaWxlc3lzdGVtJywgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnksIHtcbiAgZGlyZWN0b3JpZXM6IFt7XG4gICAgbmFtZTogJ0Fzc2V0cycsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0Fzc2V0cycsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQXVkaW9GaWxlczAnLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8wX2RlYnVnX2dyaWQnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMCcsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQXVkaW9GaWxlczEnLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMScsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQXVkaW9GaWxlczInLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMyJyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdBdWRpb0ZpbGVzMycsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzNfYmluYXVyYWxfcmlycycpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMzJyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdBdWRpb0ZpbGVzNCcsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJyksXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczQnLFxuICB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXNQaWFubycsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvcGlhbm8nKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzUGlhbm8nLFxuICB9XVxufSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tc3RyZWFtcycsIHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnksIHtcbiAgZGlyZWN0b3J5OiAncHVibGljL3BpYW5vJyxcbiAgY2FjaGU6IHRydWUsXG59LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7fSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3Rlcignc3luYycsIHBsdWdpblN5bmNGYWN0b3J5LCB7fSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcigncGxhdGZvcm0nLCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnksIHt9LCBbXSk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHJlZ2lzdGVyIHNjaGVtYXNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHNlcnZlci5zdGF0ZU1hbmFnZXIucmVnaXN0ZXJTY2hlbWEobmFtZSwgc2NoZW1hKTtcblxuXG4oYXN5bmMgZnVuY3Rpb24gbGF1bmNoKCkge1xuICB0cnkge1xuICAgIC8vIEB0b2RvIC0gY2hlY2sgaG93IHRoaXMgYmVoYXZlcyB3aXRoIGEgbm9kZSBjbGllbnQuLi5cbiAgICBhd2FpdCBzZXJ2ZXIuaW5pdChjb25maWcsIChjbGllbnRUeXBlLCBjb25maWcsIGh0dHBSZXF1ZXN0KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGllbnRUeXBlOiBjbGllbnRUeXBlLFxuICAgICAgICBhcHA6IHtcbiAgICAgICAgICBuYW1lOiBjb25maWcuYXBwLm5hbWUsXG4gICAgICAgICAgYXV0aG9yOiBjb25maWcuYXBwLmF1dGhvcixcbiAgICAgICAgfSxcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgdHlwZTogY29uZmlnLmVudi50eXBlLFxuICAgICAgICAgIHdlYnNvY2tldHM6IGNvbmZpZy5lbnYud2Vic29ja2V0cyxcbiAgICAgICAgICBhc3NldHNEb21haW46IGNvbmZpZy5lbnYuYXNzZXRzRG9tYWluLFxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGxheWVyRXhwZXJpZW5jZSA9IG5ldyBQbGF5ZXJFeHBlcmllbmNlKHNlcnZlciwgJ3BsYXllcicpO1xuXG4gICAgLy8gc3RhcnQgYWxsIHRoZSB0aGluZ3NcbiAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcbiAgICBwbGF5ZXJFeHBlcmllbmNlLnN0YXJ0KCk7XG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xuICB9XG59KSgpO1xuXG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uLCBwKSA9PiB7XG4gIGNvbnNvbGUubG9nKCc+IFVuaGFuZGxlZCBQcm9taXNlIFJlamVjdGlvbicpO1xuICBjb25zb2xlLmxvZyhyZWFzb24pO1xufSk7XG4iXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBRUE7O0FBdUJBOzs7O0FBdEJBLE1BQU1BLEdBQUcsR0FBR0MsT0FBTyxDQUFDQyxHQUFSLENBQVlGLEdBQVosSUFBbUIsU0FBL0I7QUFDQSxNQUFNRyxNQUFNLEdBQUcsSUFBQUMsa0JBQUEsRUFBVUosR0FBVixDQUFmO0FBRUEsTUFBTUssTUFBTSxHQUFHLElBQUlDLGNBQUosRUFBZixDLENBRUE7O0FBQ0FELE1BQU0sQ0FBQ0UsY0FBUCxHQUF3QjtFQUFFQyxPQUFPLEVBQVBBO0FBQUYsQ0FBeEI7QUFDQUgsTUFBTSxDQUFDSSxpQkFBUCxHQUEyQkMsYUFBQSxDQUFLQyxJ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