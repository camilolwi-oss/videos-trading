import React from 'react';
import {Composition, Folder} from 'remotion';
import './fonts';
import {EstructurasDeMercado, scenes, totalFrames} from './Video';
import {FPS, HEIGHT, WIDTH} from './theme';
import {REEL_H, REEL_W} from './reels/ReelFrame';
import {REEL01_SECONDS, Reel01, Reel01Cover} from './reels/reel01/Reel01';
import {REEL02_SECONDS, Reel02, Reel02Cover} from './reels/reel02/Reel02';
import {REEL03_SECONDS, Reel03, Reel03Cover} from './reels/reel03/Reel03';

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
    <Folder name="Reels">
      <Composition id="Reel01" component={Reel01} durationInFrames={Math.round(REEL01_SECONDS * FPS)} fps={FPS} width={REEL_W} height={REEL_H} />
      <Composition id="Reel01-portada" component={Reel01Cover} durationInFrames={1} fps={FPS} width={REEL_W} height={REEL_H} />
      <Composition id="Reel02" component={Reel02} durationInFrames={Math.round(REEL02_SECONDS * FPS)} fps={FPS} width={REEL_W} height={REEL_H} />
      <Composition id="Reel02-portada" component={Reel02Cover} durationInFrames={1} fps={FPS} width={REEL_W} height={REEL_H} />
      <Composition id="Reel03" component={Reel03} durationInFrames={Math.round(REEL03_SECONDS * FPS)} fps={FPS} width={REEL_W} height={REEL_H} />
      <Composition id="Reel03-portada" component={Reel03Cover} durationInFrames={1} fps={FPS} width={REEL_W} height={REEL_H} />
    </Folder>
  </>
);
