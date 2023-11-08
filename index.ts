import fs from 'fs';
import path from 'path';
import {exec} from 'child_process';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Function to convert MP4 to MP3
function convertToMp3(inputPath: string, outputPath: string) {
    return new Promise((resolve, reject) => {
        // Setting audio bitrate to 32k which is sufficient for speech
        // and using mono audio channel
        exec(`ffmpeg -i "${inputPath}" -b:a 32k -ac 1 -vn "${outputPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error('Error converting to MP3:', stderr);
                return reject(error);
            }
            resolve(outputPath);
        });
    });
}


// Function to transcribe audio to SRT
async function transcribeToSrt(filePath: string) {
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        language: "en",
        response_format: "srt"
    });

    // Not sure what's happening here, the response is not an object as documented, but instead the text itself.
    return transcription as unknown as string
}

// Function to clean up transcription
async function cleanUpTranscription(srtData: string) {
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content:
                    `You are a diligent proof-reader. Fix transcription errors in the given subtitle file and ensure product names 'Vaadin' and 'Hilla' are correct. 
                    KEEP TIMESTAMPS EXACTLY THE SAME.
                    Correct subtitles are critical for audience members who are deaf or hard of hearing, please do your best to ensure accuracy.
                    ONLY OUTPUT THE SRT FILE CONTENTS, DO NOT OUTPUT ANYTHING ELSE.
                `
            },
            {role: "user", content: srtData}
        ],
        model: "gpt-4-1106-preview",
        max_tokens: 4096,
    });

    return completion.choices[0].message.content || '';
}

// Main function to process the directory
async function processDirectory(directoryPath: string) {
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
        if (path.extname(file) === '.mp4') {

            const filePath = path.join(directoryPath, file);
            const mp3Path = filePath.replace('.mp4', '.mp3');
            const srtPath = filePath.replace('.mp4', '.srt');

            try {
                console.log(`Processing ${file}...`);

                // Convert to MP3
                await convertToMp3(filePath, mp3Path);
                console.log('Extracted audio from video');

                // Transcribe to SRT
                const srtData = await transcribeToSrt(mp3Path);

                // // Clean up transcription
                // const cleanedSrt = await cleanUpTranscription(srtData);

                // Save SRT file
                fs.writeFileSync(srtPath, srtData);

                console.log(`Generated subtitles for ${file}`);

            } catch (error) {
                console.error(error);
            } finally {
                fs.unlinkSync(mp3Path);
            }
        }
    }
}

// Get the directory path from the command line arguments
const directoryPath = process.argv[2];
processDirectory(directoryPath);
