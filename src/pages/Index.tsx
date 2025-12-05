import Game from '@/components/Game';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Blastar - Arcade Space Shooter</title>
        <meta name="description" content="Classic arcade space shooter game with waves of enemies, boss battles, and retro synthwave aesthetics. Play in your browser!" />
      </Helmet>
      <main className="min-h-screen bg-background overflow-hidden">
        <Game />
      </main>
    </>
  );
};

export default Index;
