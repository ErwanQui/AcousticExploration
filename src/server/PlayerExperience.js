import { AbstractExperience } from '@soundworks/core/server';

class PlayerExperience extends AbstractExperience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.filesystem = this.require('filesystem');
    this.audioBufferLoader = this.require('audio-buffer-loader');
    this.sync = this.require('sync');
    this.platform = this.require('platform');
    this.audioStreams = this.require('audio-streams');
  }

  start() {
    super.start();
  }

  enter(client) {
    super.enter(client);
  }

  exit(client) {
    super.exit(client);
  }
}

export default PlayerExperience;
