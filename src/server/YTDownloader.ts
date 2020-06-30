import YoutubeToMp3Downloader from 'youtube-mp3-downloader'

export class YoutubeDownloader {
  private id!: string;
  private ytmp3 = new YoutubeToMp3Downloader({
    ffmpegPath: '/usr/local/bin/ffmpeg', // Where is the FFmpeg binary located?
    outputPath: process.cwd() + '/out', // Where should the downloaded and encoded files be stored?
    youtubeVideoQuality: 'highest', // What video quality should be used?
    queueParallelism: 4, // How many parallel downloads/encodes should be started?
    progressTimeout: 100 // How long should be the interval of the progress reports
  })

  public onProgressChange!: (progress: YoutubeToMp3Downloader.IVideoTask) => void;
  public onError!: (error: any) => void;
  public onFinish!: (data: YoutubeToMp3Downloader.IVideoTask) => void;

  constructor (id: string) {
    this.id = id

    this.ytmp3.on('finished', (_err, data) => {
      if (this.onFinish && typeof this.onFinish === 'function') {
        this.onFinish(data)
      }
    })

    this.ytmp3.on('error', (error) => {
      if (this.onError && typeof this.onError === 'function') {
        this.onError(error)
      }
    })

    this.ytmp3.on('progress', (progress) => {
      if (this.onProgressChange && typeof this.onProgressChange === 'function') {
        this.onProgressChange(progress)
      }
    })
  }

  public download () {
    this.ytmp3.download(this.id)
  }
}
