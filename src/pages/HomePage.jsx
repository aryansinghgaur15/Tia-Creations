import React from 'react';
import Hero from '../components/Hero';
import TrustStats from '../components/TrustStats';
import Collections from '../components/Collections';
import ArtQuiz from '../components/ArtQuiz';
import CuratorStory from '../components/CuratorStory';
import Timeline from '../components/Timeline';
import FeaturedArtist from '../components/FeaturedArtist';
import CuratorsPicks from '../components/CuratorsPicks';
import RoomPreview from '../components/RoomPreview';
import Impact from '../components/Impact';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';

const HomePage = () => {
  return (
    <main className="main-content">
      <Hero />
      <TrustStats />
      <Collections />
      <ArtQuiz />
      <CuratorStory />
      <div style={{ position: 'relative' }}>
        <Timeline />
        <RoomPreview />
      </div>
      
      <FeaturedArtist />
      <CuratorsPicks />

      <Impact />
      <Testimonials />
      <Newsletter />
    </main>
  );
};

export default HomePage;
