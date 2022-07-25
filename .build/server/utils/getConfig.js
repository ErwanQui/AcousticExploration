"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _json = _interopRequireDefault(require("json5"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getConfig(ENV) {
  let envConfig = null;
  let appConfig = null;
  let servicesConfig = null; // parse env config

  try {
    const envConfigPath = _path.default.join('config', 'env', `${ENV}.json`);

    envConfig = _json.default.parse(_fs.default.readFileSync(envConfigPath, 'utf-8'));

    if (process.env.PORT) {
      envConfig.port = process.env.PORT;
    }
  } catch (err) {
    console.log(`Invalid "${ENV}" env config file`);
    process.exit(0);
  } // parse app config


  try {
    const appConfigPath = _path.default.join('config', 'application.json');

    appConfig = _json.default.parse(_fs.default.readFileSync(appConfigPath, 'utf-8'));
  } catch (err) {
    console.log(`Invalid app config file`);
    process.exit(0);
  } // parse services config
  // try {
  //   const servicesConfigPath = path.join('config', 'services.json');
  //   servicesConfig = JSON5.parse(fs.readFileSync(servicesConfigPath, 'utf-8'));
  // } catch(err) {
  //   console.log(`Invalid services config file`);
  //   process.exit(0);
  // }


  return {
    env: envConfig,
    app: appConfig
  };
}

var _default = getConfig;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRDb25maWciLCJFTlYiLCJlbnZDb25maWciLCJhcHBDb25maWciLCJzZXJ2aWNlc0NvbmZpZyIsImVudkNvbmZpZ1BhdGgiLCJwYXRoIiwiam9pbiIsIkpTT041IiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInByb2Nlc3MiLCJlbnYiLCJQT1JUIiwicG9ydCIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJleGl0IiwiYXBwQ29uZmlnUGF0aCIsImFwcCJdLCJzb3VyY2VzIjpbImdldENvbmZpZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5mdW5jdGlvbiBnZXRDb25maWcoRU5WKSB7XG4gIGxldCBlbnZDb25maWcgPSBudWxsO1xuICBsZXQgYXBwQ29uZmlnID0gbnVsbDtcbiAgbGV0IHNlcnZpY2VzQ29uZmlnID0gbnVsbDtcbiAgLy8gcGFyc2UgZW52IGNvbmZpZ1xuICB0cnkge1xuICAgIGNvbnN0IGVudkNvbmZpZ1BhdGggPSBwYXRoLmpvaW4oJ2NvbmZpZycsICdlbnYnLCBgJHtFTlZ9Lmpzb25gKTtcbiAgICBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52LlBPUlQpIHtcbiAgICAgIGVudkNvbmZpZy5wb3J0ID0gcHJvY2Vzcy5lbnYuUE9SVDtcbiAgICB9XG4gIH0gY2F0Y2goZXJyKSB7XG4gICAgY29uc29sZS5sb2coYEludmFsaWQgXCIke0VOVn1cIiBlbnYgY29uZmlnIGZpbGVgKTtcbiAgICBwcm9jZXNzLmV4aXQoMCk7XG4gIH1cbiAgLy8gcGFyc2UgYXBwIGNvbmZpZ1xuICB0cnkge1xuICAgIGNvbnN0IGFwcENvbmZpZ1BhdGggPSBwYXRoLmpvaW4oJ2NvbmZpZycsICdhcHBsaWNhdGlvbi5qc29uJyk7XG4gICAgYXBwQ29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGFwcENvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbiAgfSBjYXRjaChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhgSW52YWxpZCBhcHAgY29uZmlnIGZpbGVgKTtcbiAgICBwcm9jZXNzLmV4aXQoMCk7XG4gIH1cblxuICAvLyBwYXJzZSBzZXJ2aWNlcyBjb25maWdcbiAgLy8gdHJ5IHtcbiAgLy8gICBjb25zdCBzZXJ2aWNlc0NvbmZpZ1BhdGggPSBwYXRoLmpvaW4oJ2NvbmZpZycsICdzZXJ2aWNlcy5qc29uJyk7XG4gIC8vICAgc2VydmljZXNDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoc2VydmljZXNDb25maWdQYXRoLCAndXRmLTgnKSk7XG4gIC8vIH0gY2F0Y2goZXJyKSB7XG4gIC8vICAgY29uc29sZS5sb2coYEludmFsaWQgc2VydmljZXMgY29uZmlnIGZpbGVgKTtcbiAgLy8gICBwcm9jZXNzLmV4aXQoMCk7XG4gIC8vIH1cblxuICByZXR1cm4geyBlbnY6IGVudkNvbmZpZywgYXBwOiBhcHBDb25maWcgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZ2V0Q29uZmlnO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxTQUFTQSxTQUFULENBQW1CQyxHQUFuQixFQUF3QjtFQUN0QixJQUFJQyxTQUFTLEdBQUcsSUFBaEI7RUFDQSxJQUFJQyxTQUFTLEdBQUcsSUFBaEI7RUFDQSxJQUFJQyxjQUFjLEdBQUcsSUFBckIsQ0FIc0IsQ0FJdEI7O0VBQ0EsSUFBSTtJQUNGLE1BQU1DLGFBQWEsR0FBR0MsYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixLQUFwQixFQUE0QixHQUFFTixHQUFJLE9BQWxDLENBQXRCOztJQUNBQyxTQUFTLEdBQUdNLGFBQUEsQ0FBTUMsS0FBTixDQUFZQyxXQUFBLENBQUdDLFlBQUgsQ0FBZ0JOLGFBQWhCLEVBQStCLE9BQS9CLENBQVosQ0FBWjs7SUFFQSxJQUFJTyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsSUFBaEIsRUFBc0I7TUFDcEJaLFNBQVMsQ0FBQ2EsSUFBVixHQUFpQkgsT0FBTyxDQUFDQyxHQUFSLENBQVlDLElBQTdCO0lBQ0Q7RUFDRixDQVBELENBT0UsT0FBTUUsR0FBTixFQUFXO0lBQ1hDLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLFlBQVdqQixHQUFJLG1CQUE1QjtJQUNBVyxPQUFPLENBQUNPLElBQVIsQ0FBYSxDQUFiO0VBQ0QsQ0FmcUIsQ0FnQnRCOzs7RUFDQSxJQUFJO0lBQ0YsTUFBTUMsYUFBYSxHQUFHZCxhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLGtCQUFwQixDQUF0Qjs7SUFDQUosU0FBUyxHQUFHSyxhQUFBLENBQU1DLEtBQU4sQ0FBWUMsV0FBQSxDQUFHQyxZQUFILENBQWdCUyxhQUFoQixFQUErQixPQUEvQixDQUFaLENBQVo7RUFDRCxDQUhELENBR0UsT0FBTUosR0FBTixFQUFXO0lBQ1hDLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLHlCQUFiO0lBQ0FOLE9BQU8sQ0FBQ08sSUFBUixDQUFhLENBQWI7RUFDRCxDQXZCcUIsQ0F5QnRCO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztFQUVBLE9BQU87SUFBRU4sR0FBRyxFQUFFWCxTQUFQO0lBQWtCbUIsR0FBRyxFQUFFbEI7RUFBdkIsQ0FBUDtBQUNEOztlQUVjSCxTIn0=