/**
 * Web Worker for extracting video thumbnails using WebCodecs API.
 * This runs in a separate thread and is resistant to browser tab throttling.
 */

// Track active decoder for cleanup
let activeDecoder = null;

self.onmessage = async function(e) {
  const { videoUrl, seekTime, maxWidth } = e.data;
  
  try {
    // Fetch video data
    const response = await fetch(videoUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Use MP4Box to demux the video
    const { createFile } = await import('https://cdn.jsdelivr.net/npm/mp4box@0.5.2/+esm');
    
    const mp4boxFile = createFile();
    
    const videoInfo = await new Promise((resolve, reject) => {
      let videoTrack = null;
      
      mp4boxFile.onReady = (info) => {
        videoTrack = info.videoTracks[0];
        if (!videoTrack) {
          reject(new Error('No video track found'));
          return;
        }
        resolve({
          track: videoTrack,
          info: info,
          duration: info.duration / info.timescale
        });
      };
      
      mp4boxFile.onError = (e) => reject(new Error(`MP4Box error: ${e}`));
      
      // Feed the buffer to MP4Box
      arrayBuffer.fileStart = 0;
      mp4boxFile.appendBuffer(arrayBuffer);
      mp4boxFile.flush();
    });
    
    const { track, duration } = videoInfo;
    
    // Calculate target time
    let targetTime;
    if (seekTime === 'middle') {
      targetTime = duration / 2;
    } else {
      targetTime = Math.min(seekTime, duration * 0.9);
    }
    targetTime = Math.max(0.1, targetTime);
    
    // Get decoder configuration from track
    const codecConfig = {
      codec: track.codec,
      codedWidth: track.video.width,
      codedHeight: track.video.height,
      description: getAVCDecoderConfig(mp4boxFile, track)
    };
    
    // Calculate output dimensions
    const aspectRatio = track.video.width / track.video.height;
    const width = Math.min(maxWidth, track.video.width);
    const height = Math.round(width / aspectRatio);
    
    // Create OffscreenCanvas for rendering
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Extract samples for the target time
    const targetSample = Math.floor(targetTime * track.timescale / track.movie_duration * track.nb_samples);
    
    // Set extraction options to get samples around our target
    mp4boxFile.setExtractionOptions(track.id, null, {
      nbSamples: 30 // Get enough samples to find a keyframe
    });
    
    // Decode the frame
    const framePromise = new Promise((resolve, reject) => {
      let frameResolved = false;
      let sampleCount = 0;
      const maxSamples = 60;
      
      activeDecoder = new VideoDecoder({
        output: (frame) => {
          if (!frameResolved) {
            frameResolved = true;
            
            // Draw frame to canvas
            ctx.drawImage(frame, 0, 0, width, height);
            frame.close();
            
            if (activeDecoder) {
              activeDecoder.close();
              activeDecoder = null;
            }
            
            // Convert to blob
            canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
              .then(blob => resolve({ blob, duration }))
              .catch(reject);
          } else {
            frame.close();
          }
        },
        error: (e) => {
          if (!frameResolved) {
            reject(new Error(`Decoder error: ${e.message}`));
          }
        }
      });
      
      activeDecoder.configure(codecConfig);
      
      // Feed samples to the decoder
      mp4boxFile.onSamples = (id, user, samples) => {
        for (const sample of samples) {
          if (frameResolved || sampleCount >= maxSamples) break;
          sampleCount++;
          
          try {
            const chunk = new EncodedVideoChunk({
              type: sample.is_sync ? 'key' : 'delta',
              timestamp: sample.cts * 1000000 / track.timescale,
              duration: sample.duration * 1000000 / track.timescale,
              data: sample.data
            });
            
            if (activeDecoder && activeDecoder.state === 'configured') {
              activeDecoder.decode(chunk);
            }
          } catch (e) {
            console.warn('Failed to decode sample:', e);
          }
        }
        
        if (activeDecoder && activeDecoder.state === 'configured' && !frameResolved) {
          activeDecoder.flush().catch(() => {});
        }
      };
      
      mp4boxFile.start();
      
      // Timeout for frame extraction
      setTimeout(() => {
        if (!frameResolved) {
          reject(new Error('Frame extraction timeout'));
        }
      }, 15000);
    });
    
    const result = await framePromise;
    self.postMessage({ success: true, blob: result.blob, duration: result.duration });
    
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ success: false, error: error.message || 'Failed to extract thumbnail' });
  } finally {
    if (activeDecoder) {
      try {
        activeDecoder.close();
      } catch (e) {}
      activeDecoder = null;
    }
  }
};

/**
 * Extract AVC decoder configuration from MP4Box track
 */
function getAVCDecoderConfig(mp4boxFile, track) {
  const trak = mp4boxFile.getTrackById(track.id);
  if (!trak) return undefined;
  
  for (const entry of trak.mdia.minf.stbl.stsd.entries) {
    if (entry.avcC || entry.hvcC) {
      const box = entry.avcC || entry.hvcC;
      const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
      box.write(stream);
      return new Uint8Array(stream.buffer, 8); // Skip box header
    }
  }
  
  return undefined;
}

// Simple DataStream implementation for serializing boxes
class DataStream {
  static BIG_ENDIAN = false;
  
  constructor(buffer, offset, endian) {
    this.buffer = buffer || new ArrayBuffer(1024);
    this.dataView = new DataView(this.buffer);
    this.position = offset || 0;
    this.endian = endian;
  }
  
  writeUint8(value) {
    this.ensureCapacity(1);
    this.dataView.setUint8(this.position++, value);
  }
  
  writeUint16(value) {
    this.ensureCapacity(2);
    this.dataView.setUint16(this.position, value, this.endian);
    this.position += 2;
  }
  
  writeUint32(value) {
    this.ensureCapacity(4);
    this.dataView.setUint32(this.position, value, this.endian);
    this.position += 4;
  }
  
  writeUint8Array(arr) {
    this.ensureCapacity(arr.length);
    for (let i = 0; i < arr.length; i++) {
      this.dataView.setUint8(this.position++, arr[i]);
    }
  }
  
  ensureCapacity(bytes) {
    if (this.position + bytes > this.buffer.byteLength) {
      const newBuffer = new ArrayBuffer(this.buffer.byteLength * 2);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
      this.dataView = new DataView(this.buffer);
    }
  }
}
