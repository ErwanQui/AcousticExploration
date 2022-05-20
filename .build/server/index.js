"use strict";

require("source-map-support/register");

var _server = require("@soundworks/core/server");

var _path = _interopRequireDefault(require("path"));

var _serveStatic = _interopRequireDefault(require("serve-static"));

var _templateLiteral = _interopRequireDefault(require("template-literal"));

var _server2 = _interopRequireDefault(require("@soundworks/plugin-audio-buffer-loader/server"));

var _PlayerExperience = _interopRequireDefault(require("./PlayerExperience.js"));

var _getConfig = _interopRequireDefault(require("./utils/getConfig.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import pluginFilesystemFactory from '@soundworks/plugin-filesystem/server';
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
console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`); // -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------
// server.pluginManager.register('filesystem', pluginFilesystemFactory, {
//   directories: [{
//     name: 'images',
//     path: path.join('public', 'images'),
//     publicDirectory: '',
//   }]
// }, []);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFTlYiLCJwcm9jZXNzIiwiZW52IiwiY29uZmlnIiwiZ2V0Q29uZmlnIiwic2VydmVyIiwiU2VydmVyIiwidGVtcGxhdGVFbmdpbmUiLCJjb21waWxlIiwidGVtcGxhdGVEaXJlY3RvcnkiLCJwYXRoIiwiam9pbiIsInJvdXRlciIsInVzZSIsInNlcnZlU3RhdGljIiwiY29uc29sZSIsImxvZyIsImFwcCIsIm5hbWUiLCJwaWQiLCJwbHVnaW5NYW5hZ2VyIiwicmVnaXN0ZXIiLCJwbHVnaW5BdWRpb0J1ZmZlckxvYWRlckZhY3RvcnkiLCJsYXVuY2giLCJpbml0IiwiY2xpZW50VHlwZSIsImh0dHBSZXF1ZXN0IiwiYXV0aG9yIiwidHlwZSIsIndlYnNvY2tldHMiLCJhc3NldHNEb21haW4iLCJwbGF5ZXJFeHBlcmllbmNlIiwiUGxheWVyRXhwZXJpZW5jZSIsInN0YXJ0IiwiZXJyIiwiZXJyb3IiLCJzdGFjayIsIm9uIiwicmVhc29uIiwicCJdLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCB7IFNlcnZlciB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvc2VydmVyJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHNlcnZlU3RhdGljIGZyb20gJ3NlcnZlLXN0YXRpYyc7XG5pbXBvcnQgY29tcGlsZSBmcm9tICd0ZW1wbGF0ZS1saXRlcmFsJztcblxuaW1wb3J0IHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSBmcm9tICdAc291bmR3b3Jrcy9wbHVnaW4tYXVkaW8tYnVmZmVyLWxvYWRlci9zZXJ2ZXInO1xuLy8gaW1wb3J0IHBsdWdpbkZpbGVzeXN0ZW1GYWN0b3J5IGZyb20gJ0Bzb3VuZHdvcmtzL3BsdWdpbi1maWxlc3lzdGVtL3NlcnZlcic7XG5cbmltcG9ydCBQbGF5ZXJFeHBlcmllbmNlIGZyb20gJy4vUGxheWVyRXhwZXJpZW5jZS5qcyc7XG5cbmltcG9ydCBnZXRDb25maWcgZnJvbSAnLi91dGlscy9nZXRDb25maWcuanMnO1xuY29uc3QgRU5WID0gcHJvY2Vzcy5lbnYuRU5WIHx8ICdkZWZhdWx0JztcbmNvbnN0IGNvbmZpZyA9IGdldENvbmZpZyhFTlYpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVyKCk7XG5cbi8vIGh0bWwgdGVtcGxhdGUgYW5kIHN0YXRpYyBmaWxlcyAoaW4gbW9zdCBjYXNlLCB0aGlzIHNob3VsZCBub3QgYmUgbW9kaWZpZWQpXG5zZXJ2ZXIudGVtcGxhdGVFbmdpbmUgPSB7IGNvbXBpbGUgfTtcbnNlcnZlci50ZW1wbGF0ZURpcmVjdG9yeSA9IHBhdGguam9pbignLmJ1aWxkJywgJ3NlcnZlcicsICd0bXBsJyk7XG5zZXJ2ZXIucm91dGVyLnVzZShzZXJ2ZVN0YXRpYygncHVibGljJykpO1xuc2VydmVyLnJvdXRlci51c2UoJ2J1aWxkJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcuYnVpbGQnLCAncHVibGljJykpKTtcbnNlcnZlci5yb3V0ZXIudXNlKCd2ZW5kb3JzJywgc2VydmVTdGF0aWMocGF0aC5qb2luKCcudmVuZG9ycycsICdwdWJsaWMnKSkpO1xuc2VydmVyLnJvdXRlci51c2UoJ2ltYWdlcycsIHNlcnZlU3RhdGljKHBhdGguam9pbigncHVibGljJywgJ2ltYWdlcycpKSk7XG5cbmNvbnNvbGUubG9nKGBcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4tIGxhdW5jaGluZyBcIiR7Y29uZmlnLmFwcC5uYW1lfVwiIGluIFwiJHtFTlZ9XCIgZW52aXJvbm1lbnRcbi0gW3BpZDogJHtwcm9jZXNzLnBpZH1dXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuYCk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIHJlZ2lzdGVyIHBsdWdpbnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gc2VydmVyLnBsdWdpbk1hbmFnZXIucmVnaXN0ZXIoJ2ZpbGVzeXN0ZW0nLCBwbHVnaW5GaWxlc3lzdGVtRmFjdG9yeSwge1xuLy8gICBkaXJlY3RvcmllczogW3tcbi8vICAgICBuYW1lOiAnaW1hZ2VzJyxcbi8vICAgICBwYXRoOiBwYXRoLmpvaW4oJ3B1YmxpYycsICdpbWFnZXMnKSxcbi8vICAgICBwdWJsaWNEaXJlY3Rvcnk6ICcnLFxuLy8gICB9XVxuLy8gfSwgW10pO1xuXG5zZXJ2ZXIucGx1Z2luTWFuYWdlci5yZWdpc3RlcignYXVkaW8tYnVmZmVyLWxvYWRlcicsIHBsdWdpbkF1ZGlvQnVmZmVyTG9hZGVyRmFjdG9yeSwge30sIFtdKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gcmVnaXN0ZXIgc2NoZW1hc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gc2VydmVyLnN0YXRlTWFuYWdlci5yZWdpc3RlclNjaGVtYShuYW1lLCBzY2hlbWEpO1xuXG5cbihhc3luYyBmdW5jdGlvbiBsYXVuY2goKSB7XG4gIHRyeSB7XG4gICAgLy8gQHRvZG8gLSBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdpdGggYSBub2RlIGNsaWVudC4uLlxuICAgIGF3YWl0IHNlcnZlci5pbml0KGNvbmZpZywgKGNsaWVudFR5cGUsIGNvbmZpZywgaHR0cFJlcXVlc3QpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNsaWVudFR5cGU6IGNsaWVudFR5cGUsXG4gICAgICAgIGFwcDoge1xuICAgICAgICAgIG5hbWU6IGNvbmZpZy5hcHAubmFtZSxcbiAgICAgICAgICBhdXRob3I6IGNvbmZpZy5hcHAuYXV0aG9yLFxuICAgICAgICB9LFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICB0eXBlOiBjb25maWcuZW52LnR5cGUsXG4gICAgICAgICAgd2Vic29ja2V0czogY29uZmlnLmVudi53ZWJzb2NrZXRzLFxuICAgICAgICAgIGFzc2V0c0RvbWFpbjogY29uZmlnLmVudi5hc3NldHNEb21haW4sXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGF5ZXJFeHBlcmllbmNlID0gbmV3IFBsYXllckV4cGVyaWVuY2Uoc2VydmVyLCAncGxheWVyJyk7XG5cbiAgICAvLyBzdGFydCBhbGwgdGhlIHRoaW5nc1xuICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgIHBsYXllckV4cGVyaWVuY2Uuc3RhcnQoKTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gIH1cbn0pKCk7XG5cbnByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChyZWFzb24sIHApID0+IHtcbiAgY29uc29sZS5sb2coJz4gVW5oYW5kbGVkIFByb21pc2UgUmVqZWN0aW9uJyk7XG4gIGNvbnNvbGUubG9nKHJlYXNvbik7XG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFHQTs7QUFFQTs7OztBQUpBO0FBS0EsTUFBTUEsR0FBRyxHQUFHQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUYsR0FBWixJQUFtQixTQUEvQjtBQUNBLE1BQU1HLE1BQU0sR0FBRyxJQUFBQyxrQkFBQSxFQUFVSixHQUFWLENBQWY7QUFFQSxNQUFNSyxNQUFNLEdBQUcsSUFBSUMsY0FBSixFQUFmLEMsQ0FFQTs7QUFDQUQsTUFBTSxDQUFDRSxjQUFQLEdBQXdCO0VBQUVDLE9BQU8sRUFBUEE7QUFBRixDQUF4QjtBQUNBSCxNQUFNLENBQUNJLGlCQUFQLEdBQTJCQyxhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLFFBQXBCLEVBQThCLE1BQTlCLENBQTNCO0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLElBQUFDLG9CQUFBLEVBQVksUUFBWixDQUFsQjtBQUNBVCxNQUFNLENBQUNPLE1BQVAsQ0FBY0MsR0FBZCxDQUFrQixPQUFsQixFQUEyQixJQUFBQyxvQkFBQSxFQUFZSixhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLFFBQXBCLENBQVosQ0FBM0I7QUFDQU4sTUFBTSxDQUFDTyxNQUFQLENBQWNDLEdBQWQsQ0FBa0IsU0FBbEIsRUFBNkIsSUFBQUMsb0JBQUEsRUFBWUosYUFBQSxDQUFLQyxJQUFMLENBQVUsVUFBVixFQUFzQixRQUF0QixDQUFaLENBQTdCO0FBQ0FOLE1BQU0sQ0FBQ08sTUFBUCxDQUFjQyxHQUFkLENBQWtCLFFBQWxCLEVBQTRCLElBQUFDLG9CQUFBLEVBQVlKLGFBQUEsQ0FBS0MsSUFBTCxDQUFVLFFBQVYsRUFBb0IsUUFBcEIsQ0FBWixDQUE1QjtBQUVBSSxPQUFPLENBQUNDLEdBQVIsQ0FBYTtBQUNiO0FBQ0EsZUFBZWIsTUFBTSxDQUFDYyxHQUFQLENBQVdDLElBQUssU0FBUWxCLEdBQUk7QUFDM0MsVUFBVUMsT0FBTyxDQUFDa0IsR0FBSTtBQUN0QjtBQUNBLENBTEEsRSxDQU9BO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBZCxNQUFNLENBQUNlLGFBQVAsQ0FBcUJDLFFBQXJCLENBQThCLHFCQUE5QixFQUFxREMsZ0JBQXJELEVBQXFGLEVBQXJGLEVBQXlGLEVBQXpGLEUsQ0FFQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxDQUFDLGVBQWVDLE1BQWYsR0FBd0I7RUFDdkIsSUFBSTtJQUNGO0lBQ0EsTUFBTWxCLE1BQU0sQ0FBQ21CLElBQVAsQ0FBWXJCLE1BQVosRUFBb0IsQ0FBQ3NCLFVBQUQsRUFBYXRCLE1BQWIsRUFBcUJ1QixXQUFyQixLQUFxQztNQUM3RCxPQUFPO1FBQ0xELFVBQVUsRUFBRUEsVUFEUDtRQUVMUixHQUFHLEVBQUU7VUFDSEMsSUFBSSxFQUFFZixNQUFNLENBQUNjLEdBQVAsQ0FBV0MsSUFEZDtVQUVIUyxNQUFNLEVBQUV4QixNQUFNLENBQUNjLEdBQVAsQ0FBV1U7UUFGaEIsQ0FGQTtRQU1MekIsR0FBRyxFQUFFO1VBQ0gwQixJQUFJLEVBQUV6QixNQUFNLENBQUNELEdBQVAsQ0FBVzBCLElBRGQ7VUFFSEMsVUFBVSxFQUFFMUIsTUFBTSxDQUFDRCxHQUFQLENBQVcyQixVQUZwQjtVQUdIQyxZQUFZLEVBQUUzQixNQUFNLENBQUNELEdBQVAsQ0FBVzRCO1FBSHRCO01BTkEsQ0FBUDtJQVlELENBYkssQ0FBTjtJQWVBLE1BQU1DLGdCQUFnQixHQUFHLElBQUlDLHlCQUFKLENBQXFCM0IsTUFBckIsRUFBNkIsUUFBN0IsQ0FBekIsQ0FqQkUsQ0FtQkY7O0lBQ0EsTUFBTUEsTUFBTSxDQUFDNEIsS0FBUCxFQUFOO0lBQ0FGLGdCQUFnQixDQUFDRSxLQUFqQjtFQUVELENBdkJELENBdUJFLE9BQU9DLEdBQVAsRUFBWTtJQUNabkIsT0FBTyxDQUFDb0IsS0FBUixDQUFjRCxHQUFHLENBQUNFLEtBQWxCO0VBQ0Q7QUFDRixDQTNCRDs7QUE2QkFuQyxPQUFPLENBQUNvQyxFQUFSLENBQVcsb0JBQVgsRUFBaUMsQ0FBQ0MsTUFBRCxFQUFTQyxDQUFULEtBQWU7RUFDOUN4QixPQUFPLENBQUNDLEdBQVIsQ0FBWSwrQkFBWjtFQUNBRCxPQUFPLENBQUNDLEdBQVIsQ0FBWXNCLE1BQVo7QUFDRCxDQUhEIn0=