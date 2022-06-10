# Description

A web application to explore the acoustic of Notre-Dame

## Using

The mode can be changed in "src/clients/player/PlayerExperience.js" at l.30
Warning: Only "debug" and "streaming" modes work. There are difficulties to decode auddioData in "ambisonic" and "convolving" modes.

## Plugin repository

- [https://github.com/collective-soundworks/soundworks-plugin-audio-buffer-loader](https://github.com/collective-soundworks/soundworks-plugin-audio-buffer-loader)
- [https://github.com/collective-soundworks/soundworks-plugin-filesystem](https://github.com/collective-soundworks/soundworks-plugin-filesystem)

## Launching the application

```sh
git clone https://github.com/collective-soundworks/soundworks-examples.git
cd plugin-audio-buffer-loader-and-filesystem
npm install
npm run dev
```

## License

BSD-3-Clause
