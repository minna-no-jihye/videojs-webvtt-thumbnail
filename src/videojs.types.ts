type Child =
  | string
  | {
  name: string;
  children?: Child[] | undefined;
};


interface ComponentOptions {
  children?: Child[] | undefined;
  createEl?: boolean | undefined;
  el?: HTMLElement | undefined;
  id?: string | undefined;
}

interface ProgressControlOptions extends ComponentOptions {
  seekBar?: boolean | undefined;
}

export interface VideojsControlBar {
  progressControl?: ProgressControlOptions | boolean | undefined;
}

