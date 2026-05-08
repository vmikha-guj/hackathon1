import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { DetailScreen } from './screens/DetailScreen';
import { Scrape } from './lib/supabase';

type Screen = 'home' | 'history' | 'detail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedScrape, setSelectedScrape] = useState<Scrape | null>(null);

  function handleViewDetail(scrape: Scrape) {
    setSelectedScrape(scrape);
    setScreen('detail');
  }

  function handleNavigate(s: Screen) {
    setScreen(s);
    if (s !== 'detail') setSelectedScrape(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activeScreen={screen} onNavigate={handleNavigate} />
      <main>
        {screen === 'home' && <HomeScreen />}
        {screen === 'history' && <HistoryScreen onViewDetail={handleViewDetail} />}
        {screen === 'detail' && selectedScrape && (
          <DetailScreen scrape={selectedScrape} onBack={() => setScreen('history')} />
        )}
      </main>
    </div>
  );
}
