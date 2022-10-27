# Description

A web application to explore the acoustic of Notre-Dame

## Sub-description

This web app enable a user to hear the acoustic of a specific monument as he was really in it.

This app can work for the acoustic of any monument, as long as corresponding audio files are provided.

## Appropriation

To modify the monument's simulation, you should change the scene.json file. Examples and instructions are in 'public/assets'.

Audio files have to be placed in the "public/audio_files" folder to be read an automatically streamed.

## Event summary

- "dataLoaded", to tell that data have been loaded : dispatched in 'src/clients/player/Sources.js' and listened in 'src/clients/player/PlayerExperience.js'
- "moving, to tell that user is moving : dispatched in 'src/clients/player/Listener.js' and listened in 'src/clients/player/PlayerExperience.js'
- "audioLoaded", to tell that audio data have been loaded : dispatched in 'src/clients/player/Binaural.js' or in 'src/clients/player/Ambisonic.js' and listened in 'src/clients/player/Sources.js'
- "resize", "click", "mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend" : listened in 'src/clients/player/PlayerExperience.js'
- "deviceorientation" : listened in 'src/clients/player/Listener.js' and 'src/clients/player/Ambisonic.js'
- "deviceorientationabsolute" : listened in 'src/clients/player/Listener.js'

## Plugin repository

- [soundworks-plugin-audio-buffer-loader](https://github.com/collective-soundworks/soundworks-plugin-audio-buffer-loader)
- [soundworks-plugin-filesystem](https://github.com/collective-soundworks/soundworks-plugin-filesystem)
- [soundworks-plugin-platform](https://github.com/collective-soundworks/soundworks-plugin-platform)
- [soundworks-plugin-audio-streams](https://github.com/collective-soundworks/soundworks-plugin-audio-streams)
- [soundworks-plugin-sync](https://github.com/collective-soundworks/soundworks-plugin-sync)

## Launching the application

```sh
git clone https://github.com/collective-soundworks/soundworks-examples.git
cd plugin-audio-buffer-loader-and-filesystem
npm install
npm run dev
```

## License

BSD-3-Clause
