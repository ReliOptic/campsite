declare module 'gif.js' {
  interface GifOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
  }

  interface GifEvents {
    progress: (p: number) => void;
    finished: (blob: Blob) => void;
  }

  class GIF {
    constructor(options: GifOptions);
    on(event: 'progress', cb: (p: number) => void): void;
    on(event: 'finished', cb: (blob: Blob) => void): void;
    addFrame(canvasOrContext: HTMLCanvasElement | CanvasRenderingContext2D, options: { copy: boolean; delay?: number }): void;
    render(): void;
  }

  export default GIF;
}
