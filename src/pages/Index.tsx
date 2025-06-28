
import { useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WillForm from '@/components/WillForm';
import InactivityTimer from '@/components/InactivityTimer';
import { WillProvider } from '@/contexts/WillContext';
import { Lock, File, ArrowRight } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const { isConnected, account } = useWallet();

  useEffect(() => {
    // Add event listeners to update last active time
    const handleActivity = () => {
      // This is handled by the WillContext, but we're adding listeners here
      // We don't need to do anything in this handler
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  return (
    <WillProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main>
          <Hero />
          
          <section id="will-section" className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Create Your Crypto Will</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Specify your beneficiaries and allocation percentages. Your will executes automatically after 2 years of inactivity.
                </p>
              </div>
              
              {isConnected && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                  <div className="lg:col-span-2">
                    <WillForm />
                  </div>
                  <div>
                    <InactivityTimer />
                  </div>
                </div>
              )}
              
              {!isConnected && (
                <div className="text-center p-8 bg-muted/40 rounded-lg max-w-md mx-auto">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Connect Wallet to Continue</h3>
                  <p className="text-muted-foreground mb-0">
                    Please connect your wallet to create and manage your will
                  </p>
                </div>
              )}
            </div>
          </section>
          
          <section id="how-it-works" className="py-16 px-4 bg-muted/30">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Creating a crypto will is simple and ensures your digital assets reach your intended beneficiaries
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Connect & Setup</h3>
                  <p className="text-muted-foreground">
                    Connect your wallet and create your will by adding beneficiaries and specifying their percentage allocations.
                  </p>
                </div>
                
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Activate Your Will</h3>
                  <p className="text-muted-foreground">
                    Once you've allocated 100% of your assets, activate your will to start the inactivity timer.
                  </p>
                </div>
                
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Automatic Execution</h3>
                  <p className="text-muted-foreground">
                    After 2 years of inactivity, your will executes automatically, transferring assets to your beneficiaries.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          <section id="about" className="py-16 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">About Web3 Will Keeper</h2>
              <p className="text-muted-foreground mb-6">
                Web3 Will Keeper ensures your digital assets aren't lost forever. Using blockchain technology, we provide a 
                secure way to pass your crypto to your loved ones if something happens to you.
              </p>
              <p className="text-muted-foreground">
                Our smart contract monitors wallet activity and automatically executes your will after 2 years of inactivity. 
                No legal processes, no intermediaries—just pure decentralization.
              </p>
            </div>
          </section>
        </main>
        
        <footer className="py-8 px-4 border-t">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="font-semibold">Web3 Will Keeper</span>
              <p className="text-sm text-muted-foreground">Secure your crypto legacy</p>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Web3 Will Keeper. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </WillProvider>
  );
};

export default Index;
