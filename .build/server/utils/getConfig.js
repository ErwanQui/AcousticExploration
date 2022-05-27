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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRDb25maWciLCJFTlYiLCJlbnZDb25maWciLCJhcHBDb25maWciLCJzZXJ2aWNlc0NvbmZpZyIsImVudkNvbmZpZ1BhdGgiLCJwYXRoIiwiam9pbiIsIkpTT041IiwicGFyc2UiLCJmcyIsInJlYWRGaWxlU3luYyIsInByb2Nlc3MiLCJlbnYiLCJQT1JUIiwicG9ydCIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJleGl0IiwiYXBwQ29uZmlnUGF0aCIsImFwcCJdLCJzb3VyY2VzIjpbImdldENvbmZpZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgSlNPTjUgZnJvbSAnanNvbjUnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmZ1bmN0aW9uIGdldENvbmZpZyhFTlYpIHtcclxuICBsZXQgZW52Q29uZmlnID0gbnVsbDtcclxuICBsZXQgYXBwQ29uZmlnID0gbnVsbDtcclxuICBsZXQgc2VydmljZXNDb25maWcgPSBudWxsO1xyXG4gIC8vIHBhcnNlIGVudiBjb25maWdcclxuICB0cnkge1xyXG4gICAgY29uc3QgZW52Q29uZmlnUGF0aCA9IHBhdGguam9pbignY29uZmlnJywgJ2VudicsIGAke0VOVn0uanNvbmApO1xyXG4gICAgZW52Q29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGVudkNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcclxuXHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuUE9SVCkge1xyXG4gICAgICBlbnZDb25maWcucG9ydCA9IHByb2Nlc3MuZW52LlBPUlQ7XHJcbiAgICB9XHJcbiAgfSBjYXRjaChlcnIpIHtcclxuICAgIGNvbnNvbGUubG9nKGBJbnZhbGlkIFwiJHtFTlZ9XCIgZW52IGNvbmZpZyBmaWxlYCk7XHJcbiAgICBwcm9jZXNzLmV4aXQoMCk7XHJcbiAgfVxyXG4gIC8vIHBhcnNlIGFwcCBjb25maWdcclxuICB0cnkge1xyXG4gICAgY29uc3QgYXBwQ29uZmlnUGF0aCA9IHBhdGguam9pbignY29uZmlnJywgJ2FwcGxpY2F0aW9uLmpzb24nKTtcclxuICAgIGFwcENvbmZpZyA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhhcHBDb25maWdQYXRoLCAndXRmLTgnKSk7XHJcbiAgfSBjYXRjaChlcnIpIHtcclxuICAgIGNvbnNvbGUubG9nKGBJbnZhbGlkIGFwcCBjb25maWcgZmlsZWApO1xyXG4gICAgcHJvY2Vzcy5leGl0KDApO1xyXG4gIH1cclxuXHJcbiAgLy8gcGFyc2Ugc2VydmljZXMgY29uZmlnXHJcbiAgLy8gdHJ5IHtcclxuICAvLyAgIGNvbnN0IHNlcnZpY2VzQ29uZmlnUGF0aCA9IHBhdGguam9pbignY29uZmlnJywgJ3NlcnZpY2VzLmpzb24nKTtcclxuICAvLyAgIHNlcnZpY2VzQ29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKHNlcnZpY2VzQ29uZmlnUGF0aCwgJ3V0Zi04JykpO1xyXG4gIC8vIH0gY2F0Y2goZXJyKSB7XHJcbiAgLy8gICBjb25zb2xlLmxvZyhgSW52YWxpZCBzZXJ2aWNlcyBjb25maWcgZmlsZWApO1xyXG4gIC8vICAgcHJvY2Vzcy5leGl0KDApO1xyXG4gIC8vIH1cclxuXHJcbiAgcmV0dXJuIHsgZW52OiBlbnZDb25maWcsIGFwcDogYXBwQ29uZmlnIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdldENvbmZpZztcclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxTQUFTQSxTQUFULENBQW1CQyxHQUFuQixFQUF3QjtFQUN0QixJQUFJQyxTQUFTLEdBQUcsSUFBaEI7RUFDQSxJQUFJQyxTQUFTLEdBQUcsSUFBaEI7RUFDQSxJQUFJQyxjQUFjLEdBQUcsSUFBckIsQ0FIc0IsQ0FJdEI7O0VBQ0EsSUFBSTtJQUNGLE1BQU1DLGFBQWEsR0FBR0MsYUFBQSxDQUFLQyxJQUFMLENBQVUsUUFBVixFQUFvQixLQUFwQixFQUE0QixHQUFFTixHQUFJLE9BQWxDLENBQXRCOztJQUNBQyxTQUFTLEdBQUdNLGFBQUEsQ0FBTUMsS0FBTixDQUFZQyxXQUFBLENBQUdDLFlBQUgsQ0FBZ0JOLGFBQWhCLEVBQStCLE9BQS9CLENBQVosQ0FBWjs7SUFFQSxJQUFJTyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsSUFBaEIsRUFBc0I7TUFDcEJaLFNBQVMsQ0FBQ2EsSUFBVixHQUFpQkgsT0FBTyxDQUFDQyxHQUFSLENBQVlDLElBQTdCO0lBQ0Q7RUFDRixDQVBELENBT0UsT0FBTUUsR0FBTixFQUFXO0lBQ1hDLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLFlBQVdqQixHQUFJLG1CQUE1QjtJQUNBVyxPQUFPLENBQUNPLElBQVIsQ0FBYSxDQUFiO0VBQ0QsQ0FmcUIsQ0FnQnRCOzs7RUFDQSxJQUFJO0lBQ0YsTUFBTUMsYUFBYSxHQUFHZCxhQUFBLENBQUtDLElBQUwsQ0FBVSxRQUFWLEVBQW9CLGtCQUFwQixDQUF0Qjs7SUFDQUosU0FBUyxHQUFHSyxhQUFBLENBQU1DLEtBQU4sQ0FBWUMsV0FBQSxDQUFHQyxZQUFILENBQWdCUyxhQUFoQixFQUErQixPQUEvQixDQUFaLENBQVo7RUFDRCxDQUhELENBR0UsT0FBTUosR0FBTixFQUFXO0lBQ1hDLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLHlCQUFiO0lBQ0FOLE9BQU8sQ0FBQ08sSUFBUixDQUFhLENBQWI7RUFDRCxDQXZCcUIsQ0F5QnRCO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztFQUVBLE9BQU87SUFBRU4sR0FBRyxFQUFFWCxTQUFQO0lBQWtCbUIsR0FBRyxFQUFFbEI7RUFBdkIsQ0FBUDtBQUNEOztlQUVjSCxTIn0=