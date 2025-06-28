
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, Key, Lock, Users } from 'lucide-react';
import ConnectWallet from './ConnectWallet';
import { useWallet } from '@/hooks/useWallet';

const Hero = () => {
  const { isConnected } = useWallet();
  const [showConnect, setShowConnect] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden pt-24 pb-16 px-4 flex flex-col justify-center items-center">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="mb-8 inline-block">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary animate-fade-in">
            ✦ Secure your crypto assets for the future
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight animate-slide-up">
          Create a <span className="text-primary">crypto will</span> that activates automatically
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
          Ensure your digital assets reach your loved ones. Set up a will that executes
          automatically after 2 years of inactivity.
        </p>

        {isConnected ? (
          <Button 
            size="lg" 
            className="animate-slide-up" 
            style={{ animationDelay: '200ms' }}
          >
            Create Your Will
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button 
              size="lg" 
              className="animate-slide-up" 
              style={{ animationDelay: '200ms' }}
              onClick={() => setShowConnect(true)}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet to Start
            </Button>
            <ConnectWallet 
              open={showConnect} 
              onOpenChange={setShowConnect} 
            />
          </>
        )}
      </div>

      {animationComplete && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20 px-4 relative z-10">
          <div className="glass-card p-6 rounded-xl animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Key className="text-primary h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Setup</h3>
            <p className="text-muted-foreground">
              Connect your wallet and designate beneficiaries with just a few clicks. No complex legal processes.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Lock className="text-primary h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Automatic Execution</h3>
            <p className="text-muted-foreground">
              Your will triggers automatically after 2 years of inactivity, ensuring your assets reach their destination.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Users className="text-primary h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multiple Beneficiaries</h3>
            <p className="text-muted-foreground">
              Split your assets among multiple wallets with custom percentage allocations for each beneficiary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;
