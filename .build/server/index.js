"use strict";

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

// import 'source-map-support/register';
console.log("bah");
console.log("hmmm");
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
server.router.use('images', (0, _serveStatic.default)(_path.default.join('public', 'images'))); // server.router.use('AudioFiles0', serveStatic(path.join('public', 'grid_nav_assets/0_debug_grid')));
// server.router.use('AudioFiles1', serveStatic(path.join('public', 'grid_nav_assets/1_binaural_encoded')));

server.router.use('AudioFilesMusic1', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/1_binaural_encoded_music'))); // server.router.use('AudioFilesMusic2', serveStatic(path.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd_music')));
// server.router.use('AudioFiles2', serveStatic(path.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd')));
// server.router.use('AudioFiles3', serveStatic(path.join('public', 'grid_nav_assets/3_binaural_rirs')));
// server.router.use('AudioFiles4', serveStatic(path.join('public', 'grid_nav_assets/4_ambisonic_rirs_2nd')));
// server.router.use('AudioFilesPiano', serveStatic(path.join('public', 'piano')));

server.router.use('Assets', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/assets'))); // server.router.use('/public/piano', serveStatic(path.join('public', 'piano')));

server.router.use('/public/grid_nav_assets/1_binaural_encoded_music', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/1_binaural_encoded_music')));
console.log("oui");
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
  }, // {
  //   name: 'AudioFiles0',
  //   path: path.join(process.cwd(), 'public/grid_nav_assets/0_debug_grid'),
  //   publicDirectory: 'AudioFiles0',
  // },
  // {
  //   name: 'AudioFiles1',
  //   path: path.join(process.cwd(), 'public/grid_nav_assets/1_binaural_encoded'),
  //   publicDirectory: 'AudioFiles1',
  // },
  {
    name: 'AudioFilesMusic1',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/1_binaural_encoded_music'),
    publicDirectory: 'AudioFilesMusic1' // },
    // {
    //   name: 'AudioFilesMusic2',
    //   path: path.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd_music'),
    //   publicDirectory: 'AudioFilesMusic2',
    // },
    // {
    //   name: 'AudioFiles2',
    //   path: path.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd'),
    //   publicDirectory: 'AudioFiles2',
    // },
    // {
    //   name: 'AudioFiles3',
    //   path: path.join(process.cwd(), 'public/grid_nav_assets/3_binaural_rirs'),
    //   publicDirectory: 'AudioFiles3',
    // },
    // {
    //   name: 'AudioFiles4',
    //   path: path.join(process.cwd(), 'public/grid_nav_assets/4_ambisonic_rirs_2nd'),
    //   publicDirectory: 'AudioFiles4',
    // },
    // {
    //   name: 'AudioFilesPiano',
    //   path: path.join(process.cwd(), 'public/piano'),
    //   publicDirectory: 'AudioFilesPiano',

  }]
}, []);
server.pluginManager.register('audio-streams', _server6.default, {
  //   directory: 'public/piano',
  //   cache: true,
  // },
  // {
  directory: 'public/grid_nav_assets/1_binaural_encoded_music',
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zb2xlIiwibG9nIiwiRU5WIiwicHJvY2VzcyIsImVudiIsImNvbmZpZyIsImdldENvbmZpZyIsInNlcnZlciIsIlNlcnZlciIsInRlbXBsYXRlRW5naW5lIiwiY29tcGlsZSIsInRlbXBsYXRlRGlyZWN0b3J5IiwicGF0aCIsImpvaW4iLCJyb3V0ZXIiLCJ1c2UiLCJzZXJ2ZVN0YXRpYyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSIsImRpcmVjdG9yeSIsImNhY2hlIiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwicGx1Z2luU3luY0ZhY3RvcnkiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJsYXVuY2giLCJpbml0IiwiY2xpZW50VHlwZSIsImh0dHBSZXF1ZXN0IiwiYXV0aG9yIiwidHlwZSIsIndlYnNvY2tldHMiLCJhc3NldHNEb21haW4iLCJwbGF5ZXJFeHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsInN0YXJ0IiwiZXJyIiwiZXJyb3IiLCJzdGFjayIsIm9uIiwicmVhc29uIiwicCJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcclxuXHJcbmNvbnNvbGUubG9nKFwiYmFoXCIpXHJcblxyXG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL3NlcnZlcic7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgc2VydmVTdGF0aWMgZnJvbSAnc2VydmUtc3RhdGljJztcclxuaW1wb3J0IGNvbXBpbGUgZnJvbSAndGVtcGxhdGUtbGl0ZXJhbCc7XHJcblxyXG5pbXBvcnQgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1hdWRpby1idWZmZXItbG9hZGVyL3NlcnZlcic7XHJcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9zZXJ2ZXInO1xyXG5pbXBvcnQgcGx1Z2luU3luY0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXN5bmMvc2VydmVyJztcclxuaW1wb3J0IHBsdWdpblBsYXRmb3JtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tcGxhdGZvcm0vc2VydmVyJztcclxuaW1wb3J0IHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLXN0cmVhbXMvc2VydmVyJztcclxuXHJcbmNvbnNvbGUubG9nKFwiaG1tbVwiKVxyXG5cclxuaW1wb3J0IFBsYXllckV4cGVyaWVuY2UgZnJvbSAnLi9QbGF5ZXJFeHBlcmllbmNlLmpzJztcclxuXHJcbmltcG9ydCBnZXRDb25maWcgZnJvbSAnLi91dGlscy9nZXRDb25maWcuanMnO1xyXG5jb25zdCBFTlYgPSBwcm9jZXNzLmVudi5FTlYgfHwgJ2RlZmF1bHQnO1xyXG5jb25zdCBjb25maWcgPSBnZXRDb25maWcoRU5WKTtcclxuXHJcbmNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoKTtcclxuXHJcbi8vIGh0bWwgdGVtcGxhdGUgYW5kIHN0YXRpYyBmaWxlcyAoaW4gbW9zdCBjYXNlLCB0aGlzIHNob3VsZCBub3QgYmUgbW9kaWZpZWQpXHJcbnNlcnZlci50ZW1wbGF0ZUVuZ2luZSA9IHsgY29tcGlsZSB9O1xyXG5zZXJ2ZXIudGVtcGxhdGVEaXJlY3RvcnkgPSBwYXRoLmpvaW4oJy5idWlsZCcsICdzZXJ2ZXInLCAndG1wbCcpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZShzZXJ2ZVN0YXRpYygncHVibGljJykpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgnYnVpbGQnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJy5idWlsZCcsICdwdWJsaWMnKSkpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgndmVuZG9ycycsIHNlcnZlU3RhdGljKHBhdGguam9pbignLnZlbmRvcnMnLCAncHVibGljJykpKTtcclxuc2VydmVyLnJvdXRlci51c2UoJ2ltYWdlcycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2ltYWdlcycpKSk7XHJcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMCcsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8wX2RlYnVnX2dyaWQnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczEnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkJykpKTtcclxuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXNNdXNpYzEnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJykpKTtcclxuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXNNdXNpYzInLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmRfbXVzaWMnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczInLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvM19iaW5hdXJhbF9yaXJzJykpKTtcclxuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXM0Jywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJykpKTtcclxuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXNQaWFubycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ3BpYW5vJykpKTtcclxuc2VydmVyLnJvdXRlci51c2UoJ0Fzc2V0cycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnL3B1YmxpYy9waWFubycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ3BpYW5vJykpKTtcclxuc2VydmVyLnJvdXRlci51c2UoJy9wdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnKSkpO1xyXG5cclxuY29uc29sZS5sb2coXCJvdWlcIilcclxuXHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbi8vIGltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XHJcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuY29uc29sZS5sb2coYFxyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4tIGxhdW5jaGluZyBcIiR7Y29uZmlnLmFwcC5uYW1lfVwiIGluIFwiJHtFTlZ9XCIgZW52aXJvbm1lbnRcclxuLSBbcGlkOiAke3Byb2Nlc3MucGlkfV1cclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuYCk7XHJcblxyXG4vLyBjb25zdCBlbnZDb25maWdQYXRoID0gcGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzJywgJ2Fzc2V0cycsIGBzY2VuZS5qc29uYClcclxuLy8gdmFyIGVudkNvbmZpZyA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhlbnZDb25maWdQYXRoLCAndXRmLTgnKSk7XHJcbi8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gcmVnaXN0ZXIgcGx1Z2luc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignZmlsZXN5c3RlbScsIHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5LCB7XHJcbiAgZGlyZWN0b3JpZXM6IFt7XHJcbiAgICBuYW1lOiAnQXNzZXRzJyxcclxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMnKSxcclxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0Fzc2V0cycsXHJcbiAgfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczAnLFxyXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzBfZGVidWdfZ3JpZCcpLFxyXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczAnLFxyXG4gIC8vIH0sXHJcbiAgLy8ge1xyXG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXMxJyxcclxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSxcclxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMxJyxcclxuICAvLyB9LFxyXG4gIHtcclxuICAgIG5hbWU6ICdBdWRpb0ZpbGVzTXVzaWMxJyxcclxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnKSxcclxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNNdXNpYzEnLFxyXG4gIC8vIH0sXHJcbiAgLy8ge1xyXG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXNNdXNpYzInLFxyXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kX211c2ljJyksXHJcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzTXVzaWMyJyxcclxuICAvLyB9LFxyXG4gIC8vIHtcclxuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzMicsXHJcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnKSxcclxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMyJyxcclxuICAvLyB9LFxyXG4gIC8vIHtcclxuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzMycsXHJcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvM19iaW5hdXJhbF9yaXJzJyksXHJcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMycsXHJcbiAgLy8gfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczQnLFxyXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJyksXHJcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzNCcsXHJcbiAgLy8gfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlc1BpYW5vJyxcclxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL3BpYW5vJyksXHJcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzUGlhbm8nLFxyXG4gIH1dXHJcbn0sIFtdKTtcclxuXHJcbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1zdHJlYW1zJywgcGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSwge1xyXG4vLyAgIGRpcmVjdG9yeTogJ3B1YmxpYy9waWFubycsXHJcbi8vICAgY2FjaGU6IHRydWUsXHJcbi8vIH0sXHJcbi8vIHtcclxuICBkaXJlY3Rvcnk6ICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycsXHJcbiAgY2FjaGU6IHRydWUsXHJcbn0sIFtdKTtcclxuXHJcbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7fSwgW10pO1xyXG5cclxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ3N5bmMnLCBwbHVnaW5TeW5jRmFjdG9yeSwge30sIFtdKTtcclxuXHJcbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdwbGF0Zm9ybScsIHBsdWdpblBsYXRmb3JtRmFjdG9yeSwge30sIFtdKTtcclxuXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gcmVnaXN0ZXIgc2NoZW1hc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIHNlcnZlci5zdGF0ZU1hbmFnZXIucmVnaXN0ZXJTY2hlbWEobmFtZSwgc2NoZW1hKTtcclxuXHJcblxyXG4oYXN5bmMgZnVuY3Rpb24gbGF1bmNoKCkge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBAdG9kbyAtIGNoZWNrIGhvdyB0aGlzIGJlaGF2ZXMgd2l0aCBhIG5vZGUgY2xpZW50Li4uXHJcbiAgICBhd2FpdCBzZXJ2ZXIuaW5pdChjb25maWcsIChjbGllbnRUeXBlLCBjb25maWcsIGh0dHBSZXF1ZXN0KSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgY2xpZW50VHlwZTogY2xpZW50VHlwZSxcclxuICAgICAgICBhcHA6IHtcclxuICAgICAgICAgIG5hbWU6IGNvbmZpZy5hcHAubmFtZSxcclxuICAgICAgICAgIGF1dGhvcjogY29uZmlnLmFwcC5hdXRob3IsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnY6IHtcclxuICAgICAgICAgIHR5cGU6IGNvbmZpZy5lbnYudHlwZSxcclxuICAgICAgICAgIHdlYnNvY2tldHM6IGNvbmZpZy5lbnYud2Vic29ja2V0cyxcclxuICAgICAgICAgIGFzc2V0c0RvbWFpbjogY29uZmlnLmVudi5hc3NldHNEb21haW4sXHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcGxheWVyRXhwZXJpZW5jZSA9IG5ldyBQbGF5ZXJFeHBlcmllbmNlKHNlcnZlciwgJ3BsYXllcicpO1xyXG5cclxuICAgIC8vIHN0YXJ0IGFsbCB0aGUgdGhpbmdzXHJcbiAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcclxuICAgIHBsYXllckV4cGVyaWVuY2Uuc3RhcnQoKTtcclxuXHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XHJcbiAgfVxyXG59KSgpO1xyXG5cclxucHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKHJlYXNvbiwgcCkgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCc+IFVuaGFuZGxlZCBQcm9taXNlIFJlamVjdGlvbicpO1xyXG4gIGNvbnNvbGUubG9nKHJlYXNvbik7XHJcbn0pO1xyXG4iXSwibWFwcGluZ3MiOiI7O0FBSUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBSUE7O0FBRUE7O0FBMkJBOzs7O0FBOUNBO0FBRUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEtBQVo7QUFhQUQsT0FBTyxDQUFDQyxHQUFSLENBQVksTUFBWjtBQUtBLE1BQU1DLEdBQUcsR0FBR0MsT0FBTyxDQUFDQyxHQUFSLENBQVlGLEdBQVosSUFBbUIsU0FBL0I7QUFDQSxNQUFNRyxNQUFNLEdBQUcsSUFBQUMsa0JBQUEsRUFBVUosR0FBVixDQUFmO0FBRUEsTUFBTUssTUFBTSxHQUFHLElBQUlDLGNBQUosRUFBZixDLENBRUE7O0FBQ0FELE1BQU0sQ0FBQ0UsY0FBUCxHQUF3QjtFQUFFQyxPQUFPLEVBQVBBO0FBQUYsQ0FBeEI7QUFDQUgsTUFBTSxDQUFDSSxpQkFBUCxHQUEyQkMsYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixRQUFwQixFQUE4QixNQUE5QixDQUEzQjtBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixJQUFBQyxvQkFBQSxFQUFZLFFBQVosQ0FBbEI7QUFDQVQsTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsT0FBbEIsRUFBMkIsSUFBQUMsb0JBQUEsRUFBWUosYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixRQUFwQixDQUFaLENBQTNCO0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLFNBQWxCLEVBQTZCLElBQUFDLG9CQUFBLEVBQVlKLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFVBQVYsRUFBc0IsUUFBdEIsQ0FBWixDQUE3QjtBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixRQUFsQixFQUE0QixJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLFFBQXBCLENBQVosQ0FBNUIsRSxDQUNBO0FBQ0E7O0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLGtCQUFsQixFQUFzQyxJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLDBDQUFwQixDQUFaLENBQXRDLEUsQ0FDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixRQUFsQixFQUE0QixJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLHdCQUFwQixDQUFaLENBQTVCLEUsQ0FDQTs7QUFDQU4sTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0Isa0RBQWxCLEVBQXNFLElBQUFDLG9CQUFBLEVBQVlKLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFFBQVYsRUFBb0IsMENBQXBCLENBQVosQ0FBdEU7QUFFQWIsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBWjtBQUdBO0FBQ0E7QUFFQUQsT0FBTyxDQUFDQyxHQUFSLENBQWE7QUFDYjtBQUNBLGVBQWVJLE1BQU0sQ0FBQ1ksR0FBUCxDQUFXQyxJQUFLLFNBQVFoQixHQUFJO0FBQzNDLFVBQVVDLE9BQU8sQ0FBQ2dCLEdBQUk7QUFDdEI7QUFDQSxDQUxBLEUsQ0FPQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7O0FBRUFaLE1BQU0sQ0FBQ2EsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIsWUFBOUIsRUFBNENDLGdCQUE1QyxFQUFxRTtFQUNuRUMsV0FBVyxFQUFFLENBQUM7SUFDWkwsSUFBSSxFQUFFLFFBRE07SUFFWk4sSUFBSSxFQUFFQSxhQUFBLENBQUtDLElBQUwsQ0FBVVYsT0FBTyxDQUFDcUIsR0FBUixFQUFWLEVBQXlCLCtCQUF6QixDQUZNO0lBR1pDLGVBQWUsRUFBRTtFQUhMLENBQUQsRUFLYjtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0lBQ0VQLElBQUksRUFBRSxrQkFEUjtJQUVFTixJQUFJLEVBQUVBLGFBQUEsQ0FBS0MsSUFBTCxDQUFVVixPQUFPLENBQUNxQixHQUFSLEVBQVYsRUFBeUIsaURBQXpCLENBRlI7SUFHRUMsZUFBZSxFQUFFLGtCQUhuQixDQUlBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBOztFQTVCQSxDQWZhO0FBRHNELENBQXJFLEVBOENHLEVBOUNIO0FBZ0RBbEIsTUFBTSxDQUFDYSxhQUFQLENBQXFCQyxRQUFyQixDQUE4QixlQUE5QixFQUErQ0ssZ0JBQS9DLEVBQTBFO0VBQzFFO0VBQ0E7RUFDQTtFQUNBO0VBQ0VDLFNBQVMsRUFBRSxpREFMNkQ7RUFNeEVDLEtBQUssRUFBRTtBQU5pRSxDQUExRSxFQU9HLEVBUEg7QUFTQXJCLE1BQU0sQ0FBQ2EsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIscUJBQTlCLEVBQXFEUSxnQkFBckQsRUFBcUYsRUFBckYsRUFBeUYsRUFBekY7QUFFQXRCLE1BQU0sQ0FBQ2EsYUFBUCxDQUFxQkMsUUFBckIsQ0FBOEIsTUFBOUIsRUFBc0NTLGdCQUF0QyxFQUF5RCxFQUF6RCxFQUE2RCxFQUE3RDtBQUVBdkIsTUFBTSxDQUFDYSxhQUFQLENBQXFCQyxRQUFyQixDQUE4QixVQUE5QixFQUEwQ1UsZ0JBQTFDLEVBQWlFLEVBQWpFLEVBQXFFLEVBQXJFLEUsQ0FFQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxDQUFDLGVBQWVDLE1BQWYsR0FBd0I7RUFDdkIsSUFBSTtJQUNGO0lBQ0EsTUFBTXpCLE1BQU0sQ0FBQzBCLElBQVAsQ0FBWTVCLE1BQVosRUFBb0IsQ0FBQzZCLFVBQUQsRUFBYTdCLE1BQWIsRUFBcUI4QixXQUFyQixLQUFxQztNQUM3RCxPQUFPO1FBQ0xELFVBQVUsRUFBRUEsVUFEUDtRQUVMakIsR0FBRyxFQUFFO1VBQ0hDLElBQUksRUFBRWIsTUFBTSxDQUFDWSxHQUFQLENBQVdDLElBRGQ7VUFFSGtCLE1BQU0sRUFBRS9CLE1BQU0sQ0FBQ1ksR0FBUCxDQUFXbUI7UUFGaEIsQ0FGQTtRQU1MaEMsR0FBRyxFQUFFO1VBQ0hpQyxJQUFJLEVBQUVoQyxNQUFNLENBQUNELEdBQVAsQ0FBV2lDLElBRGQ7VUFFSEMsVUFBVSxFQUFFakMsTUFBTSxDQUFDRCxHQUFQLENBQVdrQyxVQUZwQjtVQUdIQyxZQUFZLEVBQUVsQyxNQUFNLENBQUNELEdBQVAsQ0FBV21DO1FBSHRCO01BTkEsQ0FBUDtJQVlELENBYkssQ0FBTjtJQWVBLE1BQU1DLGdCQUFnQixHQUFHLElBQUlDLHlCQUFKLENBQXFCbEMsTUFBckIsRUFBNkIsUUFBN0IsQ0FBekIsQ0FqQkUsQ0FtQkY7O0lBQ0EsTUFBTUEsTUFBTSxDQUFDbUMsS0FBUCxFQUFOO0lBQ0FGLGdCQUFnQixDQUFDRSxLQUFqQjtFQUVELENBdkJELENBdUJFLE9BQU9DLEdBQVAsRUFBWTtJQUNaM0MsT0FBTyxDQUFDNEMsS0FBUixDQUFjRCxHQUFHLENBQUNFLEtBQWxCO0VBQ0Q7QUFDRixDQTNCRDs7QUE2QkExQyxPQUFPLENBQUMyQyxFQUFSLENBQVcsb0JBQVgsRUFBaUMsQ0FBQ0MsTUFBRCxFQUFTQyxDQUFULEtBQWU7RUFDOUNoRCxPQUFPLENBQUNDLEdBQVIsQ0FBWSwrQkFBWjtFQUNBRCxPQUFPLENBQUNDLEdBQVIsQ0FBWThDLE1BQVo7QUFDRCxDQUhEIn0=