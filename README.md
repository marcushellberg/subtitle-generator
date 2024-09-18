# Subtitle generator

Generates subtitles for a given mp4 file.

## Requirements:

- Bun
- ffmpeg
- OpenAI API key as `OPENAI_API_KEY` environment variable

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts path/to/your-video.mp4
```

## Installing globally

Create a symlink to the index.ts file:

```bash
ln -s $(pwd)/index.ts ~/bin/subs
```

Then you can run the script from anywhere:

```bash
subs your-video.mp4
```
