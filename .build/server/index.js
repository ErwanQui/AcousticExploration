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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zb2xlIiwibG9nIiwiRU5WIiwicHJvY2VzcyIsImVudiIsImNvbmZpZyIsImdldENvbmZpZyIsInNlcnZlciIsIlNlcnZlciIsInRlbXBsYXRlRW5naW5lIiwiY29tcGlsZSIsInRlbXBsYXRlRGlyZWN0b3J5IiwicGF0aCIsImpvaW4iLCJyb3V0ZXIiLCJ1c2UiLCJzZXJ2ZVN0YXRpYyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSIsImRpcmVjdG9yeSIsImNhY2hlIiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwicGx1Z2luU3luY0ZhY3RvcnkiLCJwbHVnaW5QbGF0Zm9ybUZhY3RvcnkiLCJsYXVuY2giLCJpbml0IiwiY2xpZW50VHlwZSIsImh0dHBSZXF1ZXN0IiwiYXV0aG9yIiwidHlwZSIsIndlYnNvY2tldHMiLCJhc3NldHNEb21haW4iLCJwbGF5ZXJFeHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsInN0YXJ0IiwiZXJyIiwiZXJyb3IiLCJzdGFjayIsIm9uIiwicmVhc29uIiwicCJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcblxuY29uc29sZS5sb2coXCJiYWhcIilcblxuaW1wb3J0IHsgU2VydmVyIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9zZXJ2ZXInO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgc2VydmVTdGF0aWMgZnJvbSAnc2VydmUtc3RhdGljJztcbmltcG9ydCBjb21waWxlIGZyb20gJ3RlbXBsYXRlLWxpdGVyYWwnO1xuXG5pbXBvcnQgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1hdWRpby1idWZmZXItbG9hZGVyL3NlcnZlcic7XG5pbXBvcnQgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWZpbGVzeXN0ZW0vc2VydmVyJztcbmltcG9ydCBwbHVnaW5TeW5jRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tc3luYy9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpblBsYXRmb3JtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tcGxhdGZvcm0vc2VydmVyJztcbmltcG9ydCBwbHVnaW5BdWRpb1N0cmVhbXNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1hdWRpby1zdHJlYW1zL3NlcnZlcic7XG5cbmNvbnNvbGUubG9nKFwiaG1tbVwiKVxuXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG5pbXBvcnQgZ2V0Q29uZmlnIGZyb20gJy4vdXRpbHMvZ2V0Q29uZmlnLmpzJztcbmNvbnN0IEVOViA9IHByb2Nlc3MuZW52LkVOViB8fCAnZGVmYXVsdCc7XG5jb25zdCBjb25maWcgPSBnZXRDb25maWcoRU5WKTtcblxuY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlcigpO1xuXG4vLyBodG1sIHRlbXBsYXRlIGFuZCBzdGF0aWMgZmlsZXMgKGluIG1vc3QgY2FzZSwgdGhpcyBzaG91bGQgbm90IGJlIG1vZGlmaWVkKVxuc2VydmVyLnRlbXBsYXRlRW5naW5lID0geyBjb21waWxlIH07XG5zZXJ2ZXIudGVtcGxhdGVEaXJlY3RvcnkgPSBwYXRoLmpvaW4oJy5idWlsZCcsICdzZXJ2ZXInLCAndG1wbCcpO1xuc2VydmVyLnJvdXRlci51c2Uoc2VydmVTdGF0aWMoJ3B1YmxpYycpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdidWlsZCcsIHNlcnZlU3RhdGljKHBhdGguam9pbignLmJ1aWxkJywgJ3B1YmxpYycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgndmVuZG9ycycsIHNlcnZlU3RhdGljKHBhdGguam9pbignLnZlbmRvcnMnLCAncHVibGljJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdpbWFnZXMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdpbWFnZXMnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMwJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzBfZGVidWdfZ3JpZCcpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczEnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzTXVzaWMxJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlc011c2ljMicsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZF9tdXNpYycpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczInLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzNfYmluYXVyYWxfcmlycycpKSk7XG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczQnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvNF9hbWJpc29uaWNfcmlyc18ybmQnKSkpO1xuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXNQaWFubycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ3BpYW5vJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBc3NldHMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvYXNzZXRzJykpKTtcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCcvcHVibGljL3BpYW5vJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAncGlhbm8nKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJy9wdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnKSkpO1xuXG5jb25zb2xlLmxvZyhcIm91aVwiKVxuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241Jztcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zb2xlLmxvZyhgXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLSBsYXVuY2hpbmcgXCIke2NvbmZpZy5hcHAubmFtZX1cIiBpbiBcIiR7RU5WfVwiIGVudmlyb25tZW50XG4tIFtwaWQ6ICR7cHJvY2Vzcy5waWR9XVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmApO1xuXG4vLyBjb25zdCBlbnZDb25maWdQYXRoID0gcGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzJywgJ2Fzc2V0cycsIGBzY2VuZS5qc29uYClcbi8vIHZhciBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyByZWdpc3RlciBwbHVnaW5zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdmaWxlc3lzdGVtJywgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnksIHtcbiAgZGlyZWN0b3JpZXM6IFt7XG4gICAgbmFtZTogJ0Fzc2V0cycsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0Fzc2V0cycsXG4gIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczAnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8wX2RlYnVnX2dyaWQnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMCcsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczEnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMScsXG4gIC8vIH0sXG4gIHtcbiAgICBuYW1lOiAnQXVkaW9GaWxlc011c2ljMScsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNNdXNpYzEnLFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXNNdXNpYzInLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZF9tdXNpYycpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNNdXNpYzInLFxuICAvLyB9LFxuICAvLyB7XG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXMyJyxcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMicsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczMnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSxcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMycsXG4gIC8vIH0sXG4gIC8vIHtcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczQnLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy80X2FtYmlzb25pY19yaXJzXzJuZCcpLFxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXM0JyxcbiAgLy8gfSxcbiAgLy8ge1xuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzUGlhbm8nLFxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL3BpYW5vJyksXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlc1BpYW5vJyxcbiAgfV1cbn0sIFtdKTtcblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLXN0cmVhbXMnLCBwbHVnaW5BdWRpb1N0cmVhbXNGYWN0b3J5LCB7XG4vLyAgIGRpcmVjdG9yeTogJ3B1YmxpYy9waWFubycsXG4vLyAgIGNhY2hlOiB0cnVlLFxuLy8gfSxcbi8vIHtcbiAgZGlyZWN0b3J5OiAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnLFxuICBjYWNoZTogdHJ1ZSxcbn0sIFtdKTtcblxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInLCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnksIHt9LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdzeW5jJywgcGx1Z2luU3luY0ZhY3RvcnksIHt9LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdwbGF0Zm9ybScsIHBsdWdpblBsYXRmb3JtRmFjdG9yeSwge30sIFtdKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgc2NoZW1hc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gc2VydmVyLnN0YXRlTWFuYWdlci5yZWdpc3RlclNjaGVtYShuYW1lLCBzY2hlbWEpO1xuXG5cbihhc3luYyBmdW5jdGlvbiBsYXVuY2goKSB7XG4gIHRyeSB7XG4gICAgLy8gQHRvZG8gLSBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdpdGggYSBub2RlIGNsaWVudC4uLlxuICAgIGF3YWl0IHNlcnZlci5pbml0KGNvbmZpZywgKGNsaWVudFR5cGUsIGNvbmZpZywgaHR0cFJlcXVlc3QpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsaWVudFR5cGU6IGNsaWVudFR5cGUsXG4gICAgICAgIGFwcDoge1xuICAgICAgICAgIG5hbWU6IGNvbmZpZy5hcHAubmFtZSxcbiAgICAgICAgICBhdXRob3I6IGNvbmZpZy5hcHAuYXV0aG9yLFxuICAgICAgICB9LFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICB0eXBlOiBjb25maWcuZW52LnR5cGUsXG4gICAgICAgICAgd2Vic29ja2V0czogY29uZmlnLmVudi53ZWJzb2NrZXRzLFxuICAgICAgICAgIGFzc2V0c0RvbWFpbjogY29uZmlnLmVudi5hc3NldHNEb21haW4sXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGF5ZXJFeHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2Uoc2VydmVyLCAncGxheWVyJyk7XG5cbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xuICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgIHBsYXllckV4cGVyaWVuY2Uuc3RhcnQoKTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gIH1cbn0pKCk7XG5cbnByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24sIHApID0+IHtcbiAgY29uc29sZS5sb2coJz4gVW5oYW5kbGVkIFByb21pc2UgUmVqZWN0aW9uJyk7XG4gIGNvbnNvbGUubG9nKHJlYXNvbik7XG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFJQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFJQTs7QUFFQTs7QUEyQkE7Ozs7QUE5Q0E7QUFFQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBWjtBQWFBRCxPQUFPLENBQUNDLEdBQVIsQ0FBWSxNQUFaO0FBS0EsTUFBTUMsR0FBRyxHQUFHQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUYsR0FB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