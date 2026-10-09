import React from 'react';
import {OffthreadVideo, staticFile} from 'remotion';
import {useEnter} from '../../components/ui';
import {C} from '../../theme';

// The speaker's webcam, cropped square beforehand and shown in a gold ring.
// Muted: the voice comes from the normalized audio track.
export const FaceCam: React.FC<{src: string; left: number; top: number; size: number; still?: boolean; trimBefore?: number}> = ({src, left, top, size, still = false, trimBefore}) => {
  const enter = useEnter(4, 20);
  const p = still ? 1 : enter;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        padding: 6,
        background: `linear-gradient(140deg, ${C.gold}, #8a6418)`,
        boxShadow: '0 0 40px rgba(227,168,43,0.35)',
        opacity: p,
        transform: `scale(${0.85 + p * 0.15})`,
      }}
    >
      <div style={{width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: C.bg}}>
        <OffthreadVideo src={staticFile(src)} muted trimBefore={trimBefore} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </div>
  );
};
