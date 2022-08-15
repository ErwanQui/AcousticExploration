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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9TdHJlYW1zRmFjdG9yeSIsImRpcmVjdG9yeSIsImNhY2hlIiwiY29tcHJlc3MiLCJwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkiLCJwbHVnaW5TeW5jRmFjdG9yeSIsInBsdWdpblBsYXRmb3JtRmFjdG9yeSIsImxhdW5jaCIsImluaXQiLCJjbGllbnRUeXBlIiwiaHR0cFJlcXVlc3QiLCJhdXRob3IiLCJ0eXBlIiwid2Vic29ja2V0cyIsImFzc2V0c0RvbWFpbiIsInBsYXllckV4cGVyaWVuY2UiLCJQbGF5ZXJFeHBlcmllbmNlIiwic3RhcnQiLCJlcnIiLCJlcnJvciIsInN0YWNrIiwib24iLCJyZWFzb24iLCJwIl0sInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xyXG5cclxuaW1wb3J0IHsgU2VydmVyIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9zZXJ2ZXInO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNlcnZlU3RhdGljIGZyb20gJ3NlcnZlLXN0YXRpYyc7XHJcbmltcG9ydCBjb21waWxlIGZyb20gJ3RlbXBsYXRlLWxpdGVyYWwnO1xyXG5cclxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9zZXJ2ZXInO1xyXG5pbXBvcnQgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWZpbGVzeXN0ZW0vc2VydmVyJztcclxuaW1wb3J0IHBsdWdpblN5bmNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1zeW5jL3NlcnZlcic7XHJcbmltcG9ydCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLXBsYXRmb3JtL3NlcnZlcic7XHJcbmltcG9ydCBwbHVnaW5BdWRpb1N0cmVhbXNGYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1hdWRpby1zdHJlYW1zL3NlcnZlcic7XHJcblxyXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xyXG5cclxuaW1wb3J0IGdldENvbmZpZyBmcm9tICcuL3V0aWxzL2dldENvbmZpZy5qcyc7XHJcbmNvbnN0IEVOViA9IHByb2Nlc3MuZW52LkVOViB8fCAnZGVmYXVsdCc7XHJcbmNvbnN0IGNvbmZpZyA9IGdldENvbmZpZyhFTlYpO1xyXG5cclxuY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlcigpO1xyXG5cclxuLy8gaHRtbCB0ZW1wbGF0ZSBhbmQgc3RhdGljIGZpbGVzIChpbiBtb3N0IGNhc2UsIHRoaXMgc2hvdWxkIG5vdCBiZSBtb2RpZmllZClcclxuc2VydmVyLnRlbXBsYXRlRW5naW5lID0geyBjb21waWxlIH07XHJcbnNlcnZlci50ZW1wbGF0ZURpcmVjdG9yeSA9IHBhdGguam9pbignLmJ1aWxkJywgJ3NlcnZlcicsICd0bXBsJyk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKHNlcnZlU3RhdGljKCdwdWJsaWMnKSk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKCdidWlsZCcsIHNlcnZlU3RhdGljKHBhdGguam9pbignLmJ1aWxkJywgJ3B1YmxpYycpKSk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKCd2ZW5kb3JzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcudmVuZG9ycycsICdwdWJsaWMnKSkpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgnaW1hZ2VzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnaW1hZ2VzJykpKTtcclxuLy8gc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMwJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzBfZGVidWdfZ3JpZCcpKSk7XHJcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWQnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlc011c2ljMScsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8xX2JpbmF1cmFsX2VuY29kZWRfbXVzaWMnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlc011c2ljMicsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZF9tdXNpYycpKSk7XHJcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMicsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcpKSk7XHJcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczQnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvNF9hbWJpc29uaWNfcmlyc18ybmQnKSkpO1xyXG4vLyBzZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlc1BpYW5vJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAncGlhbm8nKSkpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgnQXNzZXRzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpKSk7XHJcbi8vIHNlcnZlci5yb3V0ZXIudXNlKCcvcHVibGljL3BpYW5vJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAncGlhbm8nKSkpO1xyXG5zZXJ2ZXIucm91dGVyLnVzZSgnL3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkX211c2ljJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycpKSk7XHJcblxyXG5cclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcclxuLy8gaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5jb25zb2xlLmxvZyhgXHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi0gbGF1bmNoaW5nIFwiJHtjb25maWcuYXBwLm5hbWV9XCIgaW4gXCIke0VOVn1cIiBlbnZpcm9ubWVudFxyXG4tIFtwaWQ6ICR7cHJvY2Vzcy5waWR9XVxyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5gKTtcclxuXHJcbi8vIGNvbnN0IGVudkNvbmZpZ1BhdGggPSBwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMnLCAnYXNzZXRzJywgYHNjZW5lLmpzb25gKVxyXG4vLyB2YXIgZW52Q29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGVudkNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcclxuLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyByZWdpc3RlciBwbHVnaW5zXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdmaWxlc3lzdGVtJywgcGx1Z2luRmlsZXN5c3RlbUZhY3RvcnksIHtcclxuICBkaXJlY3RvcmllczogW3tcclxuICAgIG5hbWU6ICdBc3NldHMnLFxyXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpLFxyXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXNzZXRzJyxcclxuICB9LFxyXG4gIC8vIHtcclxuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzMCcsXHJcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMF9kZWJ1Z19ncmlkJyksXHJcbiAgLy8gICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzMCcsXHJcbiAgLy8gfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlczEnLFxyXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZCcpLFxyXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczEnLFxyXG4gIC8vIH0sXHJcbiAgLy8ge1xyXG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXNNdXNpYzEnLFxyXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZF9tdXNpYycpLFxyXG4gIC8vICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlc011c2ljMScsXHJcbiAgLy8gfSxcclxuICAvLyB7XHJcbiAgLy8gICBuYW1lOiAnQXVkaW9GaWxlc011c2ljMicsXHJcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmRfbXVzaWMnKSxcclxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNNdXNpYzInLFxyXG4gIC8vIH0sXHJcbiAge1xyXG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMyJyxcclxuICAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcpLFxyXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczInLFxyXG4gIC8vIH0sXHJcbiAgLy8ge1xyXG4gIC8vICAgbmFtZTogJ0F1ZGlvRmlsZXMzJyxcclxuICAvLyAgIHBhdGg6IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy8zX2JpbmF1cmFsX3JpcnMnKSxcclxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMzJyxcclxuICAvLyB9LFxyXG4gIC8vIHtcclxuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzNCcsXHJcbiAgLy8gICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvNF9hbWJpc29uaWNfcmlyc18ybmQnKSxcclxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXM0JyxcclxuICAvLyB9LFxyXG4gIC8vIHtcclxuICAvLyAgIG5hbWU6ICdBdWRpb0ZpbGVzUGlhbm8nLFxyXG4gIC8vICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvcGlhbm8nKSxcclxuICAvLyAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXNQaWFubycsXHJcbiAgfV1cclxufSwgW10pO1xyXG5cclxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2F1ZGlvLXN0cmVhbXMnLCBwbHVnaW5BdWRpb1N0cmVhbXNGYWN0b3J5LCB7XHJcbi8vICAgZGlyZWN0b3J5OiAncHVibGljL3BpYW5vJyxcclxuLy8gICBjYWNoZTogdHJ1ZSxcclxuLy8gfSxcclxuLy8ge1xyXG4gIGRpcmVjdG9yeTogJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMl9hbWJpc29uaWNfZW5jb2RlZF8ybmQnLFxyXG4gIGNhY2hlOiB0cnVlLFxyXG4gIGNvbXByZXNzOiBmYWxzZVxyXG59LCBbXSk7XHJcblxyXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tYnVmZmVyLWxvYWRlcicsIHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSwge30sIFtdKTtcclxuXHJcbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdzeW5jJywgcGx1Z2luU3luY0ZhY3RvcnksIHt9LCBbXSk7XHJcblxyXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcigncGxhdGZvcm0nLCBwbHVnaW5QbGF0Zm9ybUZhY3RvcnksIHt9LCBbXSk7XHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIHJlZ2lzdGVyIHNjaGVtYXNcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBzZXJ2ZXIuc3RhdGVNYW5hZ2VyLnJlZ2lzdGVyU2NoZW1hKG5hbWUsIHNjaGVtYSk7XHJcblxyXG5cclxuKGFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgpIHtcclxuICB0cnkge1xyXG4gICAgLy8gQHRvZG8gLSBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdpdGggYSBub2RlIGNsaWVudC4uLlxyXG4gICAgYXdhaXQgc2VydmVyLmluaXQoY29uZmlnLCAoY2xpZW50VHlwZSwgY29uZmlnLCBodHRwUmVxdWVzdCkgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGNsaWVudFR5cGU6IGNsaWVudFR5cGUsXHJcbiAgICAgICAgYXBwOiB7XHJcbiAgICAgICAgICBuYW1lOiBjb25maWcuYXBwLm5hbWUsXHJcbiAgICAgICAgICBhdXRob3I6IGNvbmZpZy5hcHAuYXV0aG9yLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW52OiB7XHJcbiAgICAgICAgICB0eXBlOiBjb25maWcuZW52LnR5cGUsXHJcbiAgICAgICAgICB3ZWJzb2NrZXRzOiBjb25maWcuZW52LndlYnNvY2tldHMsXHJcbiAgICAgICAgICBhc3NldHNEb21haW46IGNvbmZpZy5lbnYuYXNzZXRzRG9tYWluLFxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHBsYXllckV4cGVyaWVuY2UgPSBuZXcgUGxheWVyRXhwZXJpZW5jZShzZXJ2ZXIsICdwbGF5ZXInKTtcclxuXHJcbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xyXG4gICAgYXdhaXQgc2VydmVyLnN0YXJ0KCk7XHJcbiAgICBwbGF5ZXJFeHBlcmllbmNlLnN0YXJ0KCk7XHJcblxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xyXG4gIH1cclxufSkoKTtcclxuXHJcbnByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24sIHApID0+IHtcclxuICBjb25zb2xlLmxvZygnPiBVbmhhbmRsZWQgUHJvbWlzZSBSZWplY3Rpb24nKTtcclxuICBjb25zb2xlLmxvZyhyZWFzb24pO1xyXG59KTtcclxuIl0sIm1hcHBpbmdzIjoiOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztBQTBCQTs7OztBQXpDQTtBQWdCQSxNQUFNQSxHQUFHLEdBQUdDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRixHQUFaLElBQW1CLFNBQS9CO0FBQ0EsTUFBTUcsTUFBTSxHQUFHLElBQUFDLGtCQUFBLEVBQVVKLEdBQVYsQ0FBZjtBQUVBLE1BQU1LLE1BQU0sR0FBRyxJQUFJQyxjQUFKLEVBQWYsQyxDQUVBOztBQUNBRCxNQUFNLENBQUNFLGNBQVAsR0FBd0I7RUFBRUMsT0FBTyxFQUFQQTtBQUFGLENBQXhCO0FBQ0FILE1BQU0sQ0FBQ0ksaUJBQVAsR0FBMkJDLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFFBQVYsRUFBb0IsUUFBcEIsRUFBOEIsTUFBOUIsQ0FBM0I7QUFDQU4sTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsSUFBQUMsb0JBQUEsRUFBWSxRQUFaLENBQWxCO0FBQ0FULE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLE9BQWxCLEVBQTJCLElBQUFDLG9CQUFBLEVBQVlKLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFFBQVYsRUFBb0IsUUFBcEIsQ0FBWixDQUEzQjtBQUNBTixNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixTQUFsQixFQUE2QixJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxVQUFWLEVBQXNCLFFBQXRCLENBQVosQ0FBN0I7QUFDQU4sTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsUUFBbEIsRUFBNEIsSUFBQUMsb0JBQUEsRUFBWUosYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixRQUFwQixDQUFaLENBQTVCLEUsQ0FDQTtB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