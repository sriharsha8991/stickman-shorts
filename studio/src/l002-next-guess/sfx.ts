// Sound-effect cues: [GLOBAL frame, file name in public/l002-next-guess/sfx (no extension), volume 0-1]
// Names (gen_audio.py): whoosh whoosh_long swish thud impact pop slam punch ding kaching stamp shatter explosion
// missile tick riser freeze page boing clink scribble horn buzz swirl crash chains gold stinger
export type SfxCue = [number, string, number?];
export const range = (from: number, n: number, step: number, name: string, vol = 1): SfxCue[] =>
  Array.from({ length: n }, (_, i) => [from + i * step, name, vol] as SfxCue);
