import dynamic from 'next/dynamic';

const GameInterface = dynamic(() => import('@/components/GameInterface'), {
  ssr: false
});

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <div>
        <GameInterface />
      </div>
    </div>
  );
}