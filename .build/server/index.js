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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwiY3dkIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwibGF1bmNoIiwiaW5pdCIsImNsaWVudFR5cGUiLCJodHRwUmVxdWVzdCIsImF1dGhvciIsInR5cGUiLCJ3ZWJzb2NrZXRzIiwiYXNzZXRzRG9tYWluIiwicGxheWVyRXhwZXJpZW5jZSIsIlBsYXllckV4cGVyaWVuY2UiLCJzdGFydCIsImVyciIsImVycm9yIiwic3RhY2siLCJvbiIsInJlYXNvbiIsInAiXSwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL3NlcnZlcic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBzZXJ2ZVN0YXRpYyBmcm9tICdzZXJ2ZS1zdGF0aWMnO1xuaW1wb3J0IGNvbXBpbGUgZnJvbSAndGVtcGxhdGUtbGl0ZXJhbCc7XG5cbmltcG9ydCBwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkgZnJvbSAnQHNvdW5kd29ya3MvcGx1Z2luLWF1ZGlvLWJ1ZmZlci1sb2FkZXIvc2VydmVyJztcbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9zZXJ2ZXInO1xuXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG5pbXBvcnQgZ2V0Q29uZmlnIGZyb20gJy4vdXRpbHMvZ2V0Q29uZmlnLmpzJztcbmNvbnN0IEVOViA9IHByb2Nlc3MuZW52LkVOViB8fCAnZGVmYXVsdCc7XG5jb25zdCBjb25maWcgPSBnZXRDb25maWcoRU5WKTtcblxuY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlcigpO1xuXG4vLyBodG1sIHRlbXBsYXRlIGFuZCBzdGF0aWMgZmlsZXMgKGluIG1vc3QgY2FzZSwgdGhpcyBzaG91bGQgbm90IGJlIG1vZGlmaWVkKVxuc2VydmVyLnRlbXBsYXRlRW5naW5lID0geyBjb21waWxlIH07XG5zZXJ2ZXIudGVtcGxhdGVEaXJlY3RvcnkgPSBwYXRoLmpvaW4oJy5idWlsZCcsICdzZXJ2ZXInLCAndG1wbCcpO1xuc2VydmVyLnJvdXRlci51c2Uoc2VydmVTdGF0aWMoJ3B1YmxpYycpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdidWlsZCcsIHNlcnZlU3RhdGljKHBhdGguam9pbignLmJ1aWxkJywgJ3B1YmxpYycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgndmVuZG9ycycsIHNlcnZlU3RhdGljKHBhdGguam9pbignLnZlbmRvcnMnLCAncHVibGljJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdpbWFnZXMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdpbWFnZXMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ0F1ZGlvRmlsZXMwJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCdwdWJsaWMnLCAnZ3JpZF9uYXZfYXNzZXRzLzBfZGVidWdfZ3JpZCcpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczEnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzMicsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy8yX2FtYmlzb25pY19lbmNvZGVkXzJuZCcpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnQXVkaW9GaWxlczMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvM19iaW5hdXJhbF9yaXJzJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCdBdWRpb0ZpbGVzNCcsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cy80X2FtYmlzb25pY19yaXJzXzJuZCcpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnUG9zaXRpb24nLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJ3B1YmxpYycsICdncmlkX25hdl9hc3NldHMvYXNzZXRzJykpKTtcblxuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241Jztcbi8vIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zb2xlLmxvZyhgXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLSBsYXVuY2hpbmcgXCIke2NvbmZpZy5hcHAubmFtZX1cIiBpbiBcIiR7RU5WfVwiIGVudmlyb25tZW50XG4tIFtwaWQ6ICR7cHJvY2Vzcy5waWR9XVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmApO1xuXG5cblxuXG5cblxuLy8gY29uc3QgZW52Q29uZmlnUGF0aCA9IHBhdGguam9pbigncHVibGljJywgJ2dyaWRfbmF2X2Fzc2V0cycsICdhc3NldHMnLCBgc2NlbmUuanNvbmApXG4vLyB2YXIgZW52Q29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGVudkNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbi8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcblxuXG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgcGx1Z2luc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignZmlsZXN5c3RlbScsIHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5LCB7XG4gIGRpcmVjdG9yaWVzOiBbe1xuICAgIG5hbWU6ICdQb3NpdGlvbicsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cycpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ1Bvc2l0aW9uJyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdBdWRpb0ZpbGVzMCcsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzBfZGVidWdfZ3JpZCcpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ0F1ZGlvRmlsZXMwJyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdBdWRpb0ZpbGVzMScsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzFfYmluYXVyYWxfZW5jb2RlZCcpLFxuICAgIHB1YmxpY0RpcmVjdG9yeTogJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvMV9iaW5hdXJhbF9lbmNvZGVkJyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdBdWRpb0ZpbGVzMicsXG4gICAgcGF0aDogcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzLzJfYW1iaXNvbmljX2VuY29kZWRfMm5kJyksXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczInLFxuICB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXMzJyxcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvM19iaW5hdXJhbF9yaXJzJyksXG4gICAgcHVibGljRGlyZWN0b3J5OiAnQXVkaW9GaWxlczMnLFxuICB9LFxuICB7XG4gICAgbmFtZTogJ0F1ZGlvRmlsZXM0JyxcbiAgICBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvNF9hbWJpc29uaWNfcmlyc18ybmQnKSxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdBdWRpb0ZpbGVzNCcsXG4gIH1dXG59LCBbXSk7XG5cbnNlcnZlci5wbHVnaW5NYW5hZ2VyLnJlZ2lzdGVyKCdhdWRpby1idWZmZXItbG9hZGVyJywgcGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5LCB7fSwgW10pO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyByZWdpc3RlciBzY2hlbWFzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBzZXJ2ZXIuc3RhdGVNYW5hZ2VyLnJlZ2lzdGVyU2NoZW1hKG5hbWUsIHNjaGVtYSk7XG5cblxuKGFzeW5jIGZ1bmN0aW9uIGxhdW5jaCgpIHtcbiAgdHJ5IHtcbiAgICAvLyBAdG9kbyAtIGNoZWNrIGhvdyB0aGlzIGJlaGF2ZXMgd2l0aCBhIG5vZGUgY2xpZW50Li4uXG4gICAgYXdhaXQgc2VydmVyLmluaXQoY29uZmlnLCAoY2xpZW50VHlwZSwgY29uZmlnLCBodHRwUmVxdWVzdCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2xpZW50VHlwZTogY2xpZW50VHlwZSxcbiAgICAgICAgYXBwOiB7XG4gICAgICAgICAgbmFtZTogY29uZmlnLmFwcC5uYW1lLFxuICAgICAgICAgIGF1dGhvcjogY29uZmlnLmFwcC5hdXRob3IsXG4gICAgICAgIH0sXG4gICAgICAgIGVudjoge1xuICAgICAgICAgIHR5cGU6IGNvbmZpZy5lbnYudHlwZSxcbiAgICAgICAgICB3ZWJzb2NrZXRzOiBjb25maWcuZW52LndlYnNvY2tldHMsXG4gICAgICAgICAgYXNzZXRzRG9tYWluOiBjb25maWcuZW52LmFzc2V0c0RvbWFpbixcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBsYXllckV4cGVyaWVuY2UgPSBuZXcgUGxheWVyRXhwZXJpZW5jZShzZXJ2ZXIsICdwbGF5ZXInKTtcblxuICAgIC8vIHN0YXJ0IGFsbCB0aGUgdGhpbmdzXG4gICAgYXdhaXQgc2VydmVyLnN0YXJ0KCk7XG4gICAgcGxheWVyRXhwZXJpZW5jZS5zdGFydCgpO1xuXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgfVxufSkoKTtcblxucHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKHJlYXNvbiwgcCkgPT4ge1xuICBjb25zb2xlLmxvZygnPiBVbmhhbmRsZWQgUHJvbWlzZSBSZWplY3Rpb24nKTtcbiAgY29uc29sZS5sb2cocmVhc29uKTtcbn0pO1xuIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUVBOztBQUVBOztBQXFCQTs7OztBQXBCQSxNQUFNQSxHQUFHLEdBQUdDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRixHQUFaLElBQW1CLFNBQS9CO0FBQ0EsTUFBTUcsTUFBTSxHQUFHLElBQUFDLGtCQUFBLEVBQVVKLEdBQVYsQ0FBZjtBQUVBLE1BQU1LLE1BQU0sR0FBRyxJQUFJQyxjQUFKLEVBQWYsQyxDQUVBOztBQUNBRCxNQUFNLENBQUNFLGNBQVAsR0FBd0I7RUFBRUMsT0FBTyxFQUFQQTtBQUFGLENBQXhC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