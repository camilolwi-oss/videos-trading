import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const faces: [string, string, string][] = [
  ['Inter', 'Inter-Regular.otf', '400'],
  ['Inter', 'Inter-Medium.otf', '500'],
  ['Inter', 'Inter-SemiBold.otf', '600'],
  ['Inter Display', 'InterDisplay-Bold.otf', '700'],
  ['Inter Display', 'InterDisplay-ExtraBold.otf', '800'],
];

for (const [family, file, weight] of faces) {
  loadFont({family, url: staticFile(`fonts/${file}`), weight});
}
