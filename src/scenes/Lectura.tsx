import React from 'react';
import {Background, Caption, Gold, Kicker, QuoteCard, Reveal, useWindow} from '../components/ui';
import {C, DISPLAY} from '../theme';

const questions = [
  '¿El movimiento es limpio o trabajoso?',
  '¿Alguno de los dos lados mantiene el control?',
  '¿El precio está siendo aceptado en una zona nueva, o rechazado desde ella?',
];

export const Lectura: React.FC = () => {
  const footer = useWindow(290, 600);
  return (
    <Background>
      <div style={{position: 'absolute', left: 160, right: 160, top: 110}}>
        <Reveal delay={6}>
          <QuoteCard size={50}>
            El gráfico no está solamente imprimiendo velas.
            <div style={{marginTop: 10, color: C.text, fontWeight: 600, fontSize: 44}}>
              Está mostrando el resultado de la <Gold>presión</Gold> entre compradores y vendedores.
            </div>
          </QuoteCard>
        </Reveal>
      </div>
      <div style={{position: 'absolute', left: 160, right: 160, top: 470}}>
        <Reveal delay={120}>
          <Kicker>Más que etiquetas: leé el comportamiento</Kicker>
        </Reveal>
        <div style={{display: 'flex', gap: 30, marginTop: 30}}>
          {questions.map((q, i) => (
            <Reveal key={q} delay={140 + i * 32} style={{flex: 1}}>
              <div
                style={{
                  height: 270,
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 14,
                  padding: '30px 34px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    background: C.goldSoft,
                    color: C.gold,
                    fontFamily: DISPLAY,
                    fontWeight: 800,
                    fontSize: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ?
                </div>
                <div style={{marginTop: 22, fontSize: 30, fontWeight: 500, lineHeight: 1.3}}>{q}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Caption opacity={footer} top={900} size={38} color={C.white}>
        Ya no reaccionás vela por vela: <Gold>leés el comportamiento que hay detrás de ellas.</Gold>
      </Caption>
    </Background>
  );
};
