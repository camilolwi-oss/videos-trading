import React from 'react';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {CausaEfecto} from './scenes/CausaEfecto';
import {Definicion} from './scenes/Definicion';
import {IdeasClave} from './scenes/IdeasClave';
import {Intro} from './scenes/Intro';
import {Lectura} from './scenes/Lectura';
import {Movimiento} from './scenes/Movimiento';
import {Outro} from './scenes/Outro';
import {Precio} from './scenes/Precio';
import {Presion} from './scenes/Presion';
import {Rango} from './scenes/Rango';
import {Tendencia} from './scenes/Tendencia';
import {Tiempo} from './scenes/Tiempo';
import {Transicion} from './scenes/Transicion';
import {TresEstados} from './scenes/TresEstados';

export const scenes: {id: string; frames: number; Comp: React.FC}[] = [
  {id: 'intro', frames: 180, Comp: Intro},
  {id: 'presion', frames: 480, Comp: Presion},
  {id: 'lectura', frames: 390, Comp: Lectura},
  {id: 'precio', frames: 470, Comp: Precio},
  {id: 'movimiento', frames: 560, Comp: Movimiento},
  {id: 'definicion', frames: 300, Comp: Definicion},
  {id: 'causa-efecto', frames: 540, Comp: CausaEfecto},
  {id: 'tres-estados', frames: 330, Comp: TresEstados},
  {id: 'rango', frames: 540, Comp: Rango},
  {id: 'tendencia', frames: 540, Comp: Tendencia},
  {id: 'transicion', frames: 570, Comp: Transicion},
  {id: 'tiempo', frames: 480, Comp: Tiempo},
  {id: 'ideas-clave', frames: 660, Comp: IdeasClave},
  {id: 'outro', frames: 210, Comp: Outro},
];

export const TRANSITION = 15;

export const totalFrames =
  scenes.reduce((sum, s) => sum + s.frames, 0) - TRANSITION * (scenes.length - 1);

export const EstructurasDeMercado: React.FC = () => (
  <TransitionSeries>
    {scenes.flatMap(({id, frames, Comp}, i) => {
      const seq = (
        <TransitionSeries.Sequence key={id} durationInFrames={frames} name={id}>
          <Comp />
        </TransitionSeries.Sequence>
      );
      if (i === 0) return [seq];
      return [
        <TransitionSeries.Transition
          key={`${id}-t`}
          presentation={fade()}
          timing={linearTiming({durationInFrames: TRANSITION})}
        />,
        seq,
      ];
    })}
  </TransitionSeries>
);
