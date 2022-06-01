%% init 

% init local
inputPaths = struct('audio', fullfile(pwd, 'assets', 'sounds'), 'rirs', fullfile(pwd, '4_ambisonic_rirs_2nd'));

% define sources
sources = struct('name', '', 'file', '', 'buffer', []);
sources(end+1) = struct('name', 's3', 'file', '01.wav', 'buffer', []);
sources(end+1) = struct('name', 's4', 'file', '02.wav', 'buffer', []);
sources(end+1) = struct('name', 's5', 'file', '03.wav', 'buffer', []);
sources(1) = [];

% define receivers
receivers = struct('name', '', 'file', '');
for iRcv = 1:18
    name = sprintf('m%02d', iRcv);
    receivers(end+1) = struct('name', name, 'file', ['steliz_octamic_' name '_srcIda_(ACN-SN3D-2).wav']);
end
receivers(1) = [];
isFuma = false;

% % debug: reduced receiver list
% warning('reduced receiver list');
% receivers = receivers(1);


%% preload sources

% get target fs
fileName = strrep(receivers(1).file, 'srcId', sources(1).name);
[bufferAmbiRir, fs] = audioread(fullfile(inputPaths.rirs, fileName));

% init locals
maxNumSampSources = 0;
maxNumSampReceivers = size(bufferAmbiRir, 1);
numChReceivers = size(bufferAmbiRir, 2);

% prepare hardcoded crop of rir to accelerate convolution
warning('cropping rirs');
maxNumSampReceivers = 3*fs;

% loop over sources, load, resample
for iSrc = 1:length(sources)

    % load audio source
    [bufferMono, fsTmp] = audioread(fullfile(inputPaths.audio, sources(iSrc).file));

     % resample if need be
    if( fsTmp ~= fs )
        bufferMono = resample(bufferMono, fs, fsTmp);
    end
    
    % save to locals
    sources(iSrc).buffer = bufferMono;
    maxNumSampSources = max(maxNumSampSources, length(bufferMono));
    
end

% loop over sources, add silences to dis-align
for iSrc = 1:length(sources)
    
    % prepare padding
    block = zeros(floor( 0.5*fs ), 1);
    zerosBefore = repmat(block, iSrc-1, 1);
    zerosAfter = repmat(block, length(sources) - iSrc, 1);
    
    % pad
    buffer = [zerosBefore; sources(iSrc).buffer; zerosAfter];
    
    maxNumSampSources = max(maxNumSampSources, size(buffer, 1));
    
    % save to local
    sources(iSrc).buffer = buffer;
    
end



%% rirs convolution

% init waitbar
wBar = waitbar(0, sprintf('convolution %d / %d', 0, length(receivers)));
    
% loop over receiver positions
for iRcv = 1:length(receivers)
    
    % init locals
    bufferAmbi = zeros(maxNumSampSources + maxNumSampReceivers + 1, numChReceivers);
    receiver = receivers(iRcv);
    
    % loop over sources
    for iSrc = 1:length(sources)
       
        % init locals
        source = sources(iSrc);

        % load receiver rir
        fileName = strrep(receiver.file, 'srcId', source.name);
        [bufferAmbiRir, ~] = audioread(fullfile(inputPaths.rirs, fileName));
        
        % crop rirs (to accelerate convolution)
        bufferAmbiRir = bufferAmbiRir(1:maxNumSampReceivers, :);
        
        % 1) ambi to bin of raw rirs (no convolution with audio sample)
        bufferBinRir = ambi2bin(bufferAmbiRir, fs, isFuma);
    
        % save ambisonic to disk
        fileName = strrep(fileName, '(ACN-SN3D-2)', 'bin');
        fileName = strrep(fileName, '.wav', '.mat');
        filePath = fullfile(pwd, '3_binaural_rirs', fileName);
        y = bufferBinRir; save(filePath, 'y');
        fprintf('write %s \n', filePath);
        
        % 2) convolve and sum to output
        buffer = conv2(source.buffer, bufferAmbiRir);
        %
        selVect = 1:size(buffer, 1);
        bufferAmbi(selVect, :) = bufferAmbi(selVect, :) + buffer;
               
    end

    % save ambisonic to disk
    fileName = strrep(receiver.file, '_srcIda', '');
    fileName = strrep(fileName, '.wav', '.mat');
    filePath = fullfile(pwd, '2_ambisonic_encoded_2nd', fileName);
    y = bufferAmbi; save(filePath, 'y');
    fprintf('write %s \n', filePath);
    
    % ambi to bin
    bufferBin = ambi2bin(bufferAmbi, fs, isFuma);
    
    % save binaural to disk
    fileName = strrep(receiver.file, 'srcIda_(ACN-SN3D-2)', 'bin');
    fileName = strrep(fileName, '.wav', '.mat');
    filePath = fullfile(pwd, '1_binaural_encoded', fileName);
    y = bufferBin; save(filePath, 'y');
    fprintf('write %s \n', filePath);
    
    % log
    fprintf('\n');
    waitbar(iRcv/length(receivers), wBar, sprintf('convolution %d / %d', iRcv, length(receivers)));

end

% close waitbar
close(wBar);


%% convert from .mat to .wav after normalisation

% init locals
folderList = {'1_binaural_encoded', '2_ambisonic_encoded_2nd', '3_binaural_rirs'};

% loop over folders
for iFolder = 1:length(folderList)
    
    % init local
    peakVal = 0;
    
    % get list of .mat files
    rootPath = fullfile(pwd, folderList{iFolder});
    fileList = dir(fullfile(rootPath, '*.mat'));
    
    % loop over files to get max value for normalisation
    for iFile = 1:length(fileList)
        
        % init locals
        file = fileList(iFile);
        
        % load file
        filePath = fullfile(file.folder, file.name);
        tmp = load(filePath); y = tmp.y;
        
        % get max value
        peakValLocal = max( max( abs( y )));
        peakVal = max( peakVal, peakValLocal);
        
    end
    
    % loop over files to save them as normalised .wav
    for iFile = 1:length(fileList)
        
        % init locals
        file = fileList(iFile);
        
        % load file
        filePath = fullfile(file.folder, file.name);
        tmp = load(filePath); y = tmp.y;
        
        % normalise
        y = y / peakVal;
        
        % save to disk
        filePath = strrep(filePath, '.mat', '.wav');
        audiowrite(filePath, y, fs, 'BitsPerSample', 24);
        fprintf('write %s \n', filePath);
        
        % delete original (tmp) .mat
        filePath = fullfile(file.folder, file.name);
        delete(filePath);
               
    end
    
end





























