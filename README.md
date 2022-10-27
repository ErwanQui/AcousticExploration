# Description

A web application to explore the acoustic of Notre-Dame

## Sub-description

## Use

The files used can be changed in "public/grid_nav_assets" and the corresponding repository or in "public/grid_nav_assets/assets/sounds" for the sounds used with rirs
Warning: for ambisonic sounds and rirs, the files must be in format '01_08ch' and '09_09ch'
Warning: only order 2 ambisonic can be used

You should change the json files in "public/grid_nav_assets/assets" to read the good files
Warning: in "ambiConvolving", more than 2 sounds seems to not be supported by computer (and 2 sounds is already complicated...)

## Appropriation

To modify the monument's simulation, you should change the scene.json file. Examples and instructions are in 'public/assets'.
Audio files have to be placed in the "public/audio_files" folder to be read an automatically streamed.

## Event summary

## Plugin repository

- [https://github.com/collective-soundworks/soundworks-plugin-audio-buffer-loader](https://github.com/collective-soundworks/soundworks-plugin-audio-buffer-loader)
- [https://github.com/collective-soundworks/soundworks-plugin-filesystem](https://github.com/collective-soundworks/soundworks-plugin-filesystem)
- [soundworks-plugin-platform](https://github.com/collective-soundworks/soundworks-plugin-platform)


## Launching the application

```sh
git clone https://github.com/collective-soundworks/soundworks-examples.git
cd plugin-audio-buffer-loader-and-filesystem
npm install
npm run dev
```

## License

BSD-3-Clause
