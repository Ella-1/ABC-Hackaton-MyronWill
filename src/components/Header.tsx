
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const { account, balance, connectWallet, disconnectWallet, isConnected, isConnecting } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 transition-all duration-300",
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-semibold animate-slide-up">Myron Will</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex items-center space-x-6">
            <a 
              href="#about" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
            <a 
              href="#how-it-works" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
          </nav>

          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="text-sm bg-muted py-1.5 px-3 rounded-full flex items-center">
                <Wallet className="w-4 h-4 mr-2" />
                <span className="font-medium">{truncateAddress(account!)}</span>
              </div>
              {balance && (
                <div className="text-sm bg-muted py-1.5 px-3 rounded-full">
                  {balance} ETH
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={disconnectWallet}
                className="ml-2"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="animate-pulse-slow"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {isConnected && (
            <div className="flex items-center mr-4">
              <div className="text-sm bg-muted py-1 px-2 rounded-full flex items-center">
                <span className="font-medium">{truncateAddress(account!)}</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 glass-card animate-slide-down p-4 flex flex-col space-y-4">
          <a 
            href="#about" 
            className="text-foreground py-2 px-4 hover:bg-muted/50 rounded-md"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </a>
          <a 
            href="#how-it-works" 
            className="text-foreground py-2 px-4 hover:bg-muted/50 rounded-md"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </a>
          {isConnected ? (
            <Button
              variant="secondary"
              onClick={disconnectWallet}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </Button>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
