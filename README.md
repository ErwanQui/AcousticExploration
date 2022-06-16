# Description

A web application to explore the acoustic of Notre-Dame

## Using

The mode can be changed in "src/clients/player/PlayerExperience.js" at l.30
Usable modes:
- "debug": play sources id (1 to 18)
- "streaming": play binaural 1, 2, 3
- "ambisonic": play ambisonic 1, 2, 3
- "convlving": play binaural 1, 2, 3 (or others sounds) with binaural rirs
- "ambiConvlving": play binaural 1, 2 (or others sounds) with ambisaonic rirs

The files used can be changed in "public/grid_nav_assets" and the corresponding repository or in "public/grid_nav_assets/assets/sounds" for the sounds used with rirs
Warning: for ambisonic sounds and rirs, the files must be in format '01_08ch' and '09_09ch'
Warning: only order 2 ambisonic can be used

You should change the json files in "public/grid_nav_assets/assets" to read the good files
Warning: in "ambiConvolving", more than 2 sounds seems to not be supported by computer (and 2 sounds is already complicated...)

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
