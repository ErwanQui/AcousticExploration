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

console.log("chocolatine"); // import 'source-map-support/register';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zb2xlIiwibG9nIiwiRU5WIiwicHJvY2VzcyIsImVudiIsImNvbmZpZyIsImdldENvbmZpZyIsInNlcnZlciIsIlNlcnZlciIsInRlbXBsYXRlRW5naW5lIiwiY29tcGlsZSIsInRlbXBsYXRlRGlyZWN0b3J5IiwicGF0aCIsImpvaW4iLCJyb3V0ZXIiLCJ1c2UiLCJzZXJ2ZVN0YXRpYyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSIsImRpcmVjdG9yeSIsImNhY2hlIiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwicGx1Z2luU3luY0ZhY3RvcnkiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJsYXVuY2giLCJpbml0IiwiY2xpZW50VHlwZSIsImh0dHBSZXF1ZXN0IiwiYXV0aG9yIiwidHlwZSIsIndlYnNvY2tldHMiLCJhc3NldHNEb21haW4iLCJwbGF5ZXJFeHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsInN0YXJ0IiwiZXJyIiwiZXJyb3IiLCJzdGFjayIsIm9uIiwicmVhc29uIiwicCJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnNvbGUubG9nKFwiY2hvY29sYXRpbmVcIilcblxuXG4vLyBpbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5cbmNvbnNvbGUubG9nKFwiYmFoXCIpXG5cbmltcG9ydCB7IFNlcnZlciB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvc2VydmVyJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHNlcnZlU3RhdGljIGZyb20gJ3NlcnZlLXN0YXRpYyc7XG5pbXBvcnQgY29tcGlsZSBmcm9tICd0ZW1wbGF0ZS1saXRlcmFsJztcblxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luU3luY0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXN5bmMvc2VydmVyJztcbmltcG9ydCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXBsYXRmb3JtL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tc3RyZWFtcy9zZXJ2ZXInO1xuXG5jb25zb2xlLmxvZyhcImhtbW1cIilcblxuaW1wb3J0IFBsYXllckV4cGVyaWVuY2UgZnJvbSAnLi9QbGF5ZXJFeHBlcmllbmNlLmpzJztcblxuaW1wb3J0IGdldENvbmZpZyBmcm9tICcuL3V0aWxzL2dldENvbmZpZy5qcyc7XG5jb25zdCBFTlYgPSBwcm9jZXNzLmVudi5FTlYgfHwgJ2RlZmF1bHQnO1xuY29uc3QgY29uZmlnID0gZ2V0Q29uZmlnKEVOVik7XG5cbmNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoKTtcblxuLy8gaHRtbCB0ZW1wbGF0ZSBhbmQgc3RhdGljIGZpbGVzIChpbiBtb3N0IGNhc2UsIHRoaXMgc2hvdWxkIG5vdCBiZSBtb2RpZmllZClcbnNlcnZlci50ZW1wbGF0ZUVuZ2luZSA9IHsgY29tcGlsZSB9O1xuc2VydmVyLnRlbXBsYXRlRGlyZWN0b3J5ID0gcGF0aC5qb2luKCcuYnVpbGQnLCAnc2VydmVyJywgJ3RtcGwnKTtcbnNlcnZlci5yb3V0ZXIudXNlKHNlcnZlU3RhdGljKCdwdWJsaWMnKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnYnVpbGQnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJy5idWlsZCcsICdwdWJsaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ3ZlbmRvcnMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJy52ZW5kb3JzJywgJ3B1YmxpYycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnaW1hZ2VzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnaW1hZ2VzJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMCcsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8wX2RlYnVnX2dyaWQnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMxJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZCcpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlc011c2ljMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXNNdXNpYzInLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmRfbXVzaWMnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMyJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXM0Jywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzUGlhbm8nLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdwaWFubycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXNzZXRzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnL3B1YmxpYy9waWFubycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ3BpYW5vJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCcvcHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJykpKTtcblxuY29uc29sZS5sb2coXCJvdWlcIilcblxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbi8vIGltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XG4vLyBpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc29sZS5sb2coYFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi0gbGF1bmNoaW5nIFwiJHtjb25maWcuYXBwLm5hbWV9XCIgaW4gXCIke0VOVn1cIiBlbnZpcm9ubWVudFxuLSBbcGlkOiAke3Byb2Nlc3MucGlkfV1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5gKTtcblxuLy8gY29uc3QgZW52Q29uZmlnUGF0aCA9IHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cycsICdhc3NldHMnLCBgc2NlbmUuanNvbmApXG4vLyB2YXIgZW52Q29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGVudkNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbi8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgcGx1Z2luc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignZmlsZXN5c3RlbScsIHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5LCB7XG4gIGRpcmVjdG9yaWVzOiBbe1xuICAgIG5hbWU6ICdBc3NldHMnLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBc3NldHMnLFxuICB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXMwJyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMF9kZWJ1Z19ncmlkJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczAnLFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXMxJyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczEnLFxuICAvLyB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXNNdXNpYzEnLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzTXVzaWMxJyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzTXVzaWMyJyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmRfbXVzaWMnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzTXVzaWMyJyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzMicsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczInLFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXMzJyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvM19iaW5hdXJhbF9yaXJzJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczMnLFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXM0JyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvNF9hbWJpc29uaWNfcmlyc18ybmQnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzNCcsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlc1BpYW5vJyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9waWFubycpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNQaWFubycsXG4gIH1dXG59LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1zdHJlYW1zJywgcGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSwge1xuLy8gICBkaXJlY3Rvcnk6ICdwdWJsaWMvcGlhbm8nLFxuLy8gICBjYWNoZTogdHJ1ZSxcbi8vIH0sXG4vLyB7XG4gIGRpcmVjdG9yeTogJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJyxcbiAgY2FjaGU6IHRydWUsXG59LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7fSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3Rlcignc3luYycsIHBsdWdpblN5bmNGYWN0b3J5LCB7fSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcigncGxhdGZvcm0nLCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnksIHt9LCBbXSk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHJlZ2lzdGVyIHNjaGVtYXNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHNlcnZlci5zdGF0ZU1hbmFnZXIucmVnaXN0ZXJTY2hlbWEobmFtZSwgc2NoZW1hKTtcblxuXG4oYXN5bmMgZnVuY3Rpb24gbGF1bmNoKCkge1xuICB0cnkge1xuICAgIC8vIEB0b2RvIC0gY2hlY2sgaG93IHRoaXMgYmVoYXZlcyB3aXRoIGEgbm9kZSBjbGllbnQuLi5cbiAgICBhd2FpdCBzZXJ2ZXIuaW5pdChjb25maWcsIChjbGllbnRUeXBlLCBjb25maWcsIGh0dHBSZXF1ZXN0KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjbGllbnRUeXBlOiBjbGllbnRUeXBlLFxuICAgICAgICBhcHA6IHtcbiAgICAgICAgICBuYW1lOiBjb25maWcuYXBwLm5hbWUsXG4gICAgICAgICAgYXV0aG9yOiBjb25maWcuYXBwLmF1dGhvcixcbiAgICAgICAgfSxcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgdHlwZTogY29uZmlnLmVudi50eXBlLFxuICAgICAgICAgIHdlYnNvY2tldHM6IGNvbmZpZy5lbnYud2Vic29ja2V0cyxcbiAgICAgICAgICBhc3NldHNEb21haW46IGNvbmZpZy5lbnYuYXNzZXRzRG9tYWluLFxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGxheWVyRXhwZXJpZW5jZSA9IG5ldyBQbGF5ZXJFeHBlcmllbmNlKHNlcnZlciwgJ3BsYXllcicpO1xuXG4gICAgLy8gc3RhcnQgYWxsIHRoZSB0aGluZ3NcbiAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcbiAgICBwbGF5ZXJFeHBlcmllbmNlLnN0YXJ0KCk7XG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xuICB9XG59KSgpO1xuXG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uLCBwKSA9PiB7XG4gIGNvbnNvbGUubG9nKCc+IFVuaGFuZGxlZCBQcm9taXNlIFJlamVjdGlvbicpO1xuICBjb25zb2xlLmxvZyhyZWFzb24pO1xufSk7XG4iXSwibWFwcGluZ3MiOiI7O0FBT0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBSUE7O0FBRUE7O0FBMkJBOzs7O0FBakRBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxhQUFaLEUsQ0FHQTs7QUFFQUQsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBWjtBQWFBRCxPQUFP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