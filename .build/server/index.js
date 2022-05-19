"use strict";

require("source-map-support/register");

var _server = require("@soundworks/core/server");

var _path = _interopRequireDefault(require("path"));

var _serveStatic = _interopRequireDefault(require("serve-static"));

var _templateLiteral = _interopRequireDefault(require("template-literal"));

var _server2 = _interopRequireDefault(require("@soundworks/plugin-filesystem/server"));

var _server3 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/server"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

var _getConfig = _interopRequireDefault(require("./utils/getConfig.js"));

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
server.router.use('soundbank', (0, _serveStatic.default)('soundbank'));
console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`); // -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------

server.pluginManager.register('filesystem', _server2.default, {
  directories: [{
    name: 'soundbank',
    path: 'soundbank',
    publicDirectory: 'soundbank'
  }]
}, []);
server.pluginManager.register('audio-buffer-loader', _server3.default, {}, []); // -------------------------------------------------------------------
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSIsImRpcmVjdG9yaWVzIiwicHVibGljRGlyZWN0b3J5IiwicGx1Z2luQXVkaW9CdWZmZXJMb2FkZXJGYWN0b3J5IiwibGF1bmNoIiwiaW5pdCIsImNsaWVudFR5cGUiLCJodHRwUmVxdWVzdCIsImF1dGhvciIsInR5cGUiLCJ3ZWJzb2NrZXRzIiwiYXNzZXRzRG9tYWluIiwicGxheWVyRXhwZXJpZW5jZSIsIlBsYXllckV4cGVyaWVuY2UiLCJzdGFydCIsImVyciIsImVycm9yIiwic3RhY2siLCJvbiIsInJlYXNvbiIsInAiXSwic291cmNlcyI6WyJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL3NlcnZlcic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBzZXJ2ZVN0YXRpYyBmcm9tICdzZXJ2ZS1zdGF0aWMnO1xuaW1wb3J0IGNvbXBpbGUgZnJvbSAndGVtcGxhdGUtbGl0ZXJhbCc7XG5cbmltcG9ydCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tZmlsZXN5c3RlbS9zZXJ2ZXInO1xuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9zZXJ2ZXInO1xuXG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG5pbXBvcnQgZ2V0Q29uZmlnIGZyb20gJy4vdXRpbHMvZ2V0Q29uZmlnLmpzJztcbmNvbnN0IEVOViA9IHByb2Nlc3MuZW52LkVOViB8fCAnZGVmYXVsdCc7XG5jb25zdCBjb25maWcgPSBnZXRDb25maWcoRU5WKTtcbmNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoKTtcblxuLy8gaHRtbCB0ZW1wbGF0ZSBhbmQgc3RhdGljIGZpbGVzIChpbiBtb3N0IGNhc2UsIHRoaXMgc2hvdWxkIG5vdCBiZSBtb2RpZmllZClcbnNlcnZlci50ZW1wbGF0ZUVuZ2luZSA9IHsgY29tcGlsZSB9O1xuc2VydmVyLnRlbXBsYXRlRGlyZWN0b3J5ID0gcGF0aC5qb2luKCcuYnVpbGQnLCAnc2VydmVyJywgJ3RtcGwnKTtcbnNlcnZlci5yb3V0ZXIudXNlKHNlcnZlU3RhdGljKCdwdWJsaWMnKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnYnVpbGQnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJy5idWlsZCcsICdwdWJsaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ3ZlbmRvcnMnLCBzZXJ2ZVN0YXRpYyhwYXRoLmpvaW4oJy52ZW5kb3JzJywgJ3B1YmxpYycpKSk7XG5zZXJ2ZXIucm91dGVyLnVzZSgnc291bmRiYW5rJywgc2VydmVTdGF0aWMoJ3NvdW5kYmFuaycpKTtcblxuY29uc29sZS5sb2coYFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi0gbGF1bmNoaW5nIFwiJHtjb25maWcuYXBwLm5hbWV9XCIgaW4gXCIke0VOVn1cIiBlbnZpcm9ubWVudFxuLSBbcGlkOiAke3Byb2Nlc3MucGlkfV1cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5gKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgcGx1Z2luc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge1xuICBkaXJlY3RvcmllczogW3tcbiAgICBuYW1lOiAnc291bmRiYW5rJyxcbiAgICBwYXRoOiAnc291bmRiYW5rJyxcbiAgICBwdWJsaWNEaXJlY3Rvcnk6ICdzb3VuZGJhbmsnLFxuICB9XVxufSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tYnVmZmVyLWxvYWRlcicsIHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSwge30sIFtdKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgc2NoZW1hc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gc2VydmVyLnN0YXRlTWFuYWdlci5yZWdpc3RlclNjaGVtYShuYW1lLCBzY2hlbWEpO1xuXG5cbihhc3luYyBmdW5jdGlvbiBsYXVuY2goKSB7XG4gIHRyeSB7XG4gICAgLy8gQHRvZG8gLSBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdpdGggYSBub2RlIGNsaWVudC4uLlxuICAgIGF3YWl0IHNlcnZlci5pbml0KGNvbmZpZywgKGNsaWVudFR5cGUsIGNvbmZpZywgaHR0cFJlcXVlc3QpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsaWVudFR5cGU6IGNsaWVudFR5cGUsXG4gICAgICAgIGFwcDoge1xuICAgICAgICAgIG5hbWU6IGNvbmZpZy5hcHAubmFtZSxcbiAgICAgICAgICBhdXRob3I6IGNvbmZpZy5hcHAuYXV0aG9yLFxuICAgICAgICB9LFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICB0eXBlOiBjb25maWcuZW52LnR5cGUsXG4gICAgICAgICAgd2Vic29ja2V0czogY29uZmlnLmVudi53ZWJzb2NrZXRzLFxuICAgICAgICAgIGFzc2V0c0RvbWFpbjogY29uZmlnLmVudi5hc3NldHNEb21haW4sXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGF5ZXJFeHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2Uoc2VydmVyLCAncGxheWVyJyk7XG5cbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xuICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgIHBsYXllckV4cGVyaWVuY2Uuc3RhcnQoKTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gIH1cbn0pKCk7XG5cbnByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24sIHApID0+IHtcbiAgY29uc29sZS5sb2coJz4gVW5oYW5kbGVkIFByb21pc2UgUmVqZWN0aW9uJyk7XG4gIGNvbnNvbGUubG9nKHJlYXNvbik7XG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFFQTs7QUFFQTs7OztBQUNBLE1BQU1BLEdBQUcsR0FBR0MsT0FBTyxDQUFDQyxHQUFSLENBQVlGLEdBQVosSUFBbUIsU0FBL0I7QUFDQSxNQUFNRyxNQUFNLEdBQUcsSUFBQUMsa0JBQUEsRUFBVUosR0FBVixDQUFmO0FBQ0EsTUFBTUssTUFBTSxHQUFHLElBQUlDLGNBQUosRUFBZixDLENBRUE7O0FBQ0FELE1BQU0sQ0FBQ0UsY0FBUCxHQUF3QjtFQUFFQyxPQUFPLEVBQVBBO0FBQUYsQ0FBeEI7QUFD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