import React from 'react';
import {Composition, Folder} from 'remotion';
import './fonts';
import {EstructurasDeMercado, scenes, totalFrames} from './Video';
import {FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="EstructurasDeMercado"
      component={EstructurasDeMercado}
      durationInFrames={totalFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Folder name="Escenas">
      {scenes.map(({id, frames, Comp}) => (
        <Composition key={id} id={`escena-${id}`} component={Comp} durationInFrames={frames} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </>
);
