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
// server.router.use('AudioFilesMusic1', serveStatic(path.join('public', 'grid_nav_assets/1_binaural_encoded_music')));
// server.router.use('AudioFilesMusic2', serveStatic(path.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd_music')));

server.router.use('AudioFiles2', (0, _serveStatic.default)(_path.default.join('public', 'grid_nav_assets/2_ambisonic_encoded_2nd'))); // server.router.use('AudioFiles3', serveStatic(path.join('public', 'grid_nav_assets/3_binaural_rirs')));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zb2xlIiwibG9nIiwiRU5WIiwicHJvY2VzcyIsImVudiIsImNvbmZpZyIsImdldENvbmZpZyIsInNlcnZlciIsIlNlcnZlciIsInRlbXBsYXRlRW5naW5lIiwiY29tcGlsZSIsInRlbXBsYXRlRGlyZWN0b3J5IiwicGF0aCIsImpvaW4iLCJyb3V0ZXIiLCJ1c2UiLCJzZXJ2ZVN0YXRpYyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSIsImRpcmVjdG9yeSIsImNhY2hlIiwiY29tcHJlc3MiLCJwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkiLCJwbHVnaW5TeW5jRmFjdG9yeSIsInBsdWdpblBsYXRmb3JtRmFjdG9yeSIsImxhdW5jaCIsImluaXQiLCJjbGllbnRUeXBlIiwiaHR0cFJlcXVlc3QiLCJhdXRob3IiLCJ0eXBlIiwid2Vic29ja2V0cyIsImFzc2V0c0RvbWFpbiIsInBsYXllckV4cGVyaWVuY2UiLCJQbGF5ZXJFeHBlcmllbmNlIiwic3RhcnQiLCJlcnIiLCJlcnJvciIsInN0YWNrIiwib24iLCJyZWFzb24iLCJwIl0sInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuXG5jb25zb2xlLmxvZyhcImJhaFwiKVxuXG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL3NlcnZlcic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBzZXJ2ZVN0YXRpYyBmcm9tICdzZXJ2ZS1zdGF0aWMnO1xuaW1wb3J0IGNvbXBpbGUgZnJvbSAndGVtcGxhdGUtbGl0ZXJhbCc7XG5cbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvc2VydmVyJztcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpblN5bmNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1zeW5jL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luUGxhdGZvcm1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1wbGF0Zm9ybS9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLXN0cmVhbXMvc2VydmVyJztcblxuY29uc29sZS5sb2coXCJobW1tXCIpXG5cbmltcG9ydCBQbGF5ZXJFeHBlcmllbmNlIGZyb20gJy4vUGxheWVyRXhwZXJpZW5jZS5qcyc7XG5cbmltcG9ydCBnZXRDb25maWcgZnJvbSAnLi91dGlscy9nZXRDb25maWcuanMnO1xuY29uc3QgRU5WID0gcHJvY2Vzcy5lbnYuRU5WIHx8ICdkZWZhdWx0JztcbmNvbnN0IGNvbmZpZyA9IGdldENvbmZpZyhFTlYpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKCk7XG5cbi8vIGh0bWwgdGVtcGxhdGUgYW5kIHN0YXRpYyBmaWxlcyAoaW4gbW9zdCBjYXNlLCB0aGlzIHNob3VsZCBub3QgYmUgbW9kaWZpZWQpXG5zZXJ2ZXIudGVtcGxhdGVFbmdpbmUgPSB7IGNvbXBpbGUgfTtcbnNlcnZlci50ZW1wbGF0ZURpcmVjdG9yeSA9IHBhdGguam9pbignLmJ1aWxkJywgJ3NlcnZlcicsICd0bXBsJyk7XG5zZXJ2ZXIucm91dGVyLnVzZShzZXJ2ZVN0YXRpYygncHVibGljJykpO1xuc2VydmVyLnJvdXRlci51c2UoJ2J1aWxkJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcuYnVpbGQnLCAncHVibGljJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCd2ZW5kb3JzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcudmVuZG9ycycsICdwdWJsaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ2ltYWdlcycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2ltYWdlcycpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczAnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMF9kZWJ1Z19ncmlkJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXNNdXNpYzEnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzTXVzaWMyJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kX211c2ljJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMicsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvM19iaW5hdXJhbF9yaXJzJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzNCcsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy80X2FtYmlzb25pY19yaXJzXzJuZCcpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlc1BpYW5vJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAncGlhbm8nKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ0Fzc2V0cycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJy9wdWJsaWMvcGlhbm8nLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdwaWFubycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnL3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycpKSk7XG5cbmNvbnNvbGUubG9nKFwib3VpXCIpXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG4vLyBpbXBvcnQgSlNPTjUgZnJvbSAnanNvbjUnO1xuLy8gaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnNvbGUubG9nKGBcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4tIGxhdW5jaGluZyBcIiR7Y29uZmlnLmFwcC5uYW1lfVwiIGluIFwiJHtFTlZ9XCIgZW52aXJvbm1lbnRcbi0gW3BpZDogJHtwcm9jZXNzLnBpZH1dXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuYCk7XG5cbi8vIGNvbnN0IGVudkNvbmZpZ1BhdGggPSBwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMnLCAnYXNzZXRzJywgYHNjZW5lLmpzb25gKVxuLy8gdmFyIGVudkNvbmZpZyA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhlbnZDb25maWdQYXRoLCAndXRmLTgnKSk7XG4vLyBjb25zb2xlLmxvZyhlbnZDb25maWcpXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHJlZ2lzdGVyIHBsdWdpbnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge1xuICBkaXJlY3RvcmllczogW3tcbiAgICBuYW1lOiAnQXNzZXRzJyxcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvYXNzZXRzJyksXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXNzZXRzJyxcbiAgfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzMCcsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzBfZGVidWdfZ3JpZCcpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMwJyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzMScsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZCcpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMxJyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzTXVzaWMxJyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlc011c2ljMScsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlc011c2ljMicsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kX211c2ljJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlc011c2ljMicsXG4gIC8vIH0sXG4gIHtcbiAgICBuYW1lOiAnQXVkaW9GaWxlczInLFxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMyJyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzMycsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzNfYmluYXVyYWxfcmlycycpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMzJyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzNCcsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzRfYW1iaXNvbmljX3JpcnNfMm5kJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczQnLFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXNQaWFubycsXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvcGlhbm8nKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzUGlhbm8nLFxuICB9XVxufSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tc3RyZWFtcycsIHBsdWdpbkF1ZGlvU3RyZWFtc0ZhY3RvcnksIHtcbi8vICAgZGlyZWN0b3J5OiAncHVibGljL3BpYW5vJyxcbi8vICAgY2FjaGU6IHRydWUsXG4vLyB9LFxuLy8ge1xuICBkaXJlY3Rvcnk6ICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kJyxcbiAgY2FjaGU6IHRydWUsXG4gIGNvbXByZXNzOiBmYWxzZVxufSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tYnVmZmVyLWxvYWRlcicsIHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSwge30sIFtdKTtcblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ3N5bmMnLCBwbHVnaW5TeW5jRmFjdG9yeSwge30sIFtdKTtcblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ3BsYXRmb3JtJywgcGx1Z2luUGxhdGZvcm1GYWN0b3J5LCB7fSwgW10pO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyByZWdpc3RlciBzY2hlbWFzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBzZXJ2ZXIuc3RhdGVNYW5hZ2VyLnJlZ2lzdGVyU2NoZW1hKG5hbWUsIHNjaGVtYSk7XG5cblxuKGFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgpIHtcbiAgdHJ5IHtcbiAgICAvLyBAdG9kbyAtIGNoZWNrIGhvdyB0aGlzIGJlaGF2ZXMgd2l0aCBhIG5vZGUgY2xpZW50Li4uXG4gICAgYXdhaXQgc2VydmVyLmluaXQoY29uZmlnLCAoY2xpZW50VHlwZSwgY29uZmlnLCBodHRwUmVxdWVzdCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xpZW50VHlwZTogY2xpZW50VHlwZSxcbiAgICAgICAgYXBwOiB7XG4gICAgICAgICAgbmFtZTogY29uZmlnLmFwcC5uYW1lLFxuICAgICAgICAgIGF1dGhvcjogY29uZmlnLmFwcC5hdXRob3IsXG4gICAgICAgIH0sXG4gICAgICAgIGVudjoge1xuICAgICAgICAgIHR5cGU6IGNvbmZpZy5lbnYudHlwZSxcbiAgICAgICAgICB3ZWJzb2NrZXRzOiBjb25maWcuZW52LndlYnNvY2tldHMsXG4gICAgICAgICAgYXNzZXRzRG9tYWluOiBjb25maWcuZW52LmFzc2V0c0RvbWFpbixcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBsYXllckV4cGVyaWVuY2UgPSBuZXcgUGxheWVyRXhwZXJpZW5jZShzZXJ2ZXIsICdwbGF5ZXInKTtcblxuICAgIC8vIHN0YXJ0IGFsbCB0aGUgdGhpbmdzXG4gICAgYXdhaXQgc2VydmVyLnN0YXJ0KCk7XG4gICAgcGxheWVyRXhwZXJpZW5jZS5zdGFydCgpO1xuXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgfVxufSkoKTtcblxucHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKHJlYXNvbiwgcCkgPT4ge1xuICBjb25zb2xlLmxvZygnPiBVbmhhbmRsZWQgUHJvbWlzZSBSZWplY3Rpb24nKTtcbiAgY29uc29sZS5sb2cocmVhc29uKTtcbn0pO1xuIl0sIm1hcHBpbmdzIjoiOztBQUlBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUlBOztBQUVBOztBQTJCQTs7OztBQTlDQTtBQUVBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxLQUFaO0FBYUFELE9BQU8sQ0FBQ0MsR0FBUixDQUFZLE1BQVo7QUFLQSxNQUFNQyxHQUFHLEdB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