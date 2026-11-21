import css from './Label.module.css';

export type LabelTone = 'red' | 'green';

/** Coloured tag in the top-right corner of a slide. */
export function Label({
  text,
  size,
  tone,
}: {
  text: string;
  size: 'small' | 'big';
  tone: LabelTone;
}) {
  return <div className={`${css.label} ${css[size]} ${css[tone]}`}>{text}</div>;
}
