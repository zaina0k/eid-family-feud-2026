import React from 'react';
import { useGame } from './state/gameStore.jsx';
import Home from './components/Home/Home.jsx';
import Question from './components/Question/Question.jsx';
import Transition from './components/Transition/Transition.jsx';
import End from './components/End/End.jsx';
import { textOn } from './components/shared/contrast.js';

const NEUTRAL_BG = '#0b1020';

export default function App() {
  const { state } = useGame();
  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId);
  const bg =
    state.phase === 'question' && activeTeam ? activeTeam.color : NEUTRAL_BG;
  const fg = textOn(bg);

  const style = {
    background: bg,
    color: fg,
    '--page-bg': bg,
    '--page-fg': fg,
  };

  return (
    <div className="app-root" data-phase={state.phase} style={style}>
      {state.phase === 'home' && <Home />}
      {state.phase === 'question' && <Question />}
      {state.phase === 'transition' && <Transition />}
      {state.phase === 'end' && <End />}
    </div>
  );
}
