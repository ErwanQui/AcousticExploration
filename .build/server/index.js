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
// server.router.use('AudioFilesMusic1', serveStatic(path.join('public', 'grid_nav_assets/1_binaural_encoded_music')));
// server.router.use('AudioFilesMusic2', serveStatic(path.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd_music')));

server.router.use('AudioFiles2', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd'))); // server.router.use('AudioFiles3', serveStatic(path.join('public', 'grid_nav_assets/3_binaural_rirs')));
// server.router.use('AudioFiles4', serveStatic(path.join('public', 'grid_nav_assets/4_ambisonic_rirs_2nd')));
// server.router.use('AudioFilesPiano', serveStatic(path.join('public', 'piano')));

server.router.use('Assets', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/assets'))); // server.router.use('/public/piano', serveStatic(path.join('public', 'piano')));

server.router.use('/public/grid_nav_assets/1_binaural_encoded_music', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/1_binaural_encoded_music')));
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
  // {
  //   name: 'AudioFilesMusic1',
  //   path: path.join(process.cwd(), 'public/grid_nav_assets/1_binaural_encoded_music'),
  //   publicDirectory: 'AudioFilesMusic1',
  // },
  // {
  //   name: 'AudioFilesMusic2',
  //   path: path.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd_music'),
  //   publicDirectory: 'AudioFilesMusic2',
  // },
  {
    name: 'AudioFiles2',
    path: _path.default.join(process.cwd(), 'public/grid_nav_assets/2_ambisonic_encoded_2nd'),
    publicDirectory: 'AudioFiles2' // },
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
  directory: 'public/grid_nav_assets/2_ambisonic_encoded_2nd',
  cache: true,
  compress: false
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSIsImRpcmVjdG9yeSIsImNhY2hlIiwiY29tcHJlc3MiLCJwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkiLCJwbHVnaW5TeW5jRmFjdG9yeSIsInBsdWdpblBsYXRmb3JtRmFjdG9yeSIsImxhdW5jaCIsImluaXQiLCJjbGllbnRUeXBlIiwiaHR0cFJlcXVlc3QiLCJhdXRob3IiLCJ0eXBlIiwid2Vic29ja2V0cyIsImFzc2V0c0RvbWFpbiIsInBsYXllckV4cGVyaWVuY2UiLCJQbGF5ZXJFeHBlcmllbmNlIiwic3RhcnQiLCJlcnIiLCJlcnJvciIsInN0YWNrIiwib24iLCJyZWFzb24iLCJwIl0sInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuXG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL3NlcnZlcic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBzZXJ2ZVN0YXRpYyBmcm9tICdzZXJ2ZS1zdGF0aWMnO1xuaW1wb3J0IGNvbXBpbGUgZnJvbSAndGVtcGxhdGUtbGl0ZXJhbCc7XG5cbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvc2VydmVyJztcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpblN5bmNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1zeW5jL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luUGxhdGZvcm1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1wbGF0Zm9ybS9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLXN0cmVhbXMvc2VydmVyJztcblxuaW1wb3J0IFBsYXllckV4cGVyaWVuY2UgZnJvbSAnLi9QbGF5ZXJFeHBlcmllbmNlLmpzJztcblxuaW1wb3J0IGdldENvbmZpZyBmcm9tICcuL3V0aWxzL2dldENvbmZpZy5qcyc7XG5jb25zdCBFTlYgPSBwcm9jZXNzLmVudi5FTlYgfHwgJ2RlZmF1bHQnO1xuY29uc3QgY29uZmlnID0gZ2V0Q29uZmlnKEVOVik7XG5cbmNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoKTtcblxuLy8gaHRtbCB0ZW1wbGF0ZSBhbmQgc3RhdGljIGZpbGVzIChpbiBtb3N0IGNhc2UsIHRoaXMgc2hvdWxkIG5vdCBiZSBtb2RpZmllZClcbnNlcnZlci50ZW1wbGF0ZUVuZ2luZSA9IHsgY29tcGlsZSB9O1xuc2VydmVyLnRlbXBsYXRlRGlyZWN0b3J5ID0gcGF0aC5qb2luKCcuYnVpbGQnLCAnc2VydmVyJywgJ3RtcGwnKTtcbnNlcnZlci5yb3V0ZXIudXNlKHNlcnZlU3RhdGljKCdwdWJsaWMnKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnYnVpbGQnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJy5idWlsZCcsICdwdWJsaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ3ZlbmRvcnMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJy52ZW5kb3JzJywgJ3B1YmxpYycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnaW1hZ2VzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnaW1hZ2VzJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMCcsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8wX2RlYnVnX2dyaWQnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMxJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZCcpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlc011c2ljMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXNNdXNpYzInLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmRfbXVzaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMyJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXM0Jywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzUGlhbm8nLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdwaWFubycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXNzZXRzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnL3B1YmxpYy9waWFubycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ3BpYW5vJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCcvcHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJykpKTtcblxuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241Jztcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zb2xlLmxvZyhgXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLSBsYXVuY2hpbmcgXCIke2NvbmZpZy5hcHAubmFtZX1cIiBpbiBcIiR7RU5WfVwiIGVudmlyb25tZW50XG4tIFtwaWQ6ICR7cHJvY2Vzcy5waWR9XVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmApO1xuXG4vLyBjb25zdCBlbnZDb25maWdQYXRoID0gcGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzJywgJ2Fzc2V0cycsIGBzY2VuZS5qc29uYClcbi8vIHZhciBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyByZWdpc3RlciBwbHVnaW5zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdmaWxlc3lzdGVtJywgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnksIHtcbiAgZGlyZWN0b3JpZXM6IFt7XG4gICAgbmFtZTogJ0Fzc2V0cycsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0Fzc2V0cycsXG4gIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczAnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8wX2RlYnVnX2dyaWQnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMCcsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczEnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMScsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlc011c2ljMScsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNNdXNpYzEnLFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXNNdXNpYzInLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZF9tdXNpYycpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNNdXNpYzInLFxuICAvLyB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMyJyxcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMicsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczMnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMycsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczQnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy80X2FtYmlzb25pY19yaXJzXzJuZCcpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXM0JyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzUGlhbm8nLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL3BpYW5vJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlc1BpYW5vJyxcbiAgfV1cbn0sIFtdKTtcblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLXN0cmVhbXMnLCBwbHVnaW5BdWRpb1N0cmVhbXNGYWN0b3J5LCB7XG4vLyAgIGRpcmVjdG9yeTogJ3B1YmxpYy9waWFubycsXG4vLyAgIGNhY2hlOiB0cnVlLFxuLy8gfSxcbi8vIHtcbiAgZGlyZWN0b3J5OiAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcsXG4gIGNhY2hlOiB0cnVlLFxuICBjb21wcmVzczogZmFsc2Vcbn0sIFtdKTtcblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInLCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnksIHt9LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdzeW5jJywgcGx1Z2luU3luY0ZhY3RvcnksIHt9LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdwbGF0Zm9ybScsIHBsdWdpblBsYXRmb3JtRmFjdG9yeSwge30sIFtdKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgc2NoZW1hc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gc2VydmVyLnN0YXRlTWFuYWdlci5yZWdpc3RlclNjaGVtYShuYW1lLCBzY2hlbWEpO1xuXG5cbihhc3luYyBmdW5jdGlvbiBsYXVuY2goKSB7XG4gIHRyeSB7XG4gICAgLy8gQHRvZG8gLSBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdpdGggYSBub2RlIGNsaWVudC4uLlxuICAgIGF3YWl0IHNlcnZlci5pbml0KGNvbmZpZywgKGNsaWVudFR5cGUsIGNvbmZpZywgaHR0cFJlcXVlc3QpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsaWVudFR5cGU6IGNsaWVudFR5cGUsXG4gICAgICAgIGFwcDoge1xuICAgICAgICAgIG5hbWU6IGNvbmZpZy5hcHAubmFtZSxcbiAgICAgICAgICBhdXRob3I6IGNvbmZpZy5hcHAuYXV0aG9yLFxuICAgICAgICB9LFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICB0eXBlOiBjb25maWcuZW52LnR5cGUsXG4gICAgICAgICAgd2Vic29ja2V0czogY29uZmlnLmVudi53ZWJzb2NrZXRzLFxuICAgICAgICAgIGFzc2V0c0RvbWFpbjogY29uZmlnLmVudi5hc3NldHNEb21haW4sXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGF5ZXJFeHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2Uoc2VydmVyLCAncGxheWVyJyk7XG5cbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xuICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgIHBsYXllckV4cGVyaWVuY2Uuc3RhcnQoKTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gIH1cbn0pKCk7XG5cbnByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24sIHApID0+IHtcbiAgY29uc29sZS5sb2coJz4gVW5oYW5kbGVkIFByb21pc2UgUmVqZWN0aW9uJyk7XG4gIGNvbnNvbGUubG9nKHJlYXNvbik7XG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUEwQkE7Ozs7QUF6Q0E7QUFnQkEsTUFBTUEsR0FBRyxHQUFHQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUYsR0FBWixJQUFtQixTQUEvQjtBQUNBLE1BQU1HLE1BQU0sR0FBRyxJQUFBQyxrQkFBQSxFQUFVSixHQUFWLENBQWY7QUFFQSxNQUFNSyxNQUFNLEdBQUcsSUFBSUMsY0FBSixFQUFmLEMsQ0FF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