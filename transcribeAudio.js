// Speech to Text is still a TODO, still figuring out

var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var fs = require('fs');

var speech_to_text = new SpeechToTextV1 ({
  username: '{username}',
  password: '{password}'
});

// params.payload should be passed in as base64
params.model: 'en-US_BroadbandModel',
params.content_type: 'audio/flac',

// Create the stream.
var recognizeStream = speech_to_text.createRecognizeStream(params);

// Pipe in the audio.
fs.createReadStream('audio-file.flac').pipe(recognizeStream);

// Pipe out the transcription to a file.
recognizeStream.pipe(fs.createWriteStream('transcription.txt'));

// Get strings instead of buffers from 'data' events.
recognizeStream.setEncoding('utf8');
