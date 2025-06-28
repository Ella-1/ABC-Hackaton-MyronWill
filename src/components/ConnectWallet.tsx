
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from '@/hooks/useWallet';
import { AlertCircle, Wallet } from 'lucide-react';
import { useEffect, useState } from "react";

interface ConnectWalletProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectWallet = ({ open, onOpenChange }: ConnectWalletProps) => {
  const { connectWallet, isConnected, isConnecting } = useWallet();
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if MetaMask is available
    setHasMetaMask(typeof window !== 'undefined' && 
      window.ethereum !== undefined && 
      window.ethereum.isMetaMask);
      
    // Close dialog if already connected
    if (isConnected && open) {
      onOpenChange(false);
    }
  }, [isConnected, open, onOpenChange]);

  // Handle the connect action
  const handleConnect = async () => {
    await connectWallet();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center text-xl">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-center">
            Connect your wallet to create and manage your crypto will
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          {hasMetaMask === false && (
            <div className="bg-muted p-4 rounded-lg mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium">MetaMask not detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please install the MetaMask browser extension to continue.
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="px-0 h-auto text-xs text-primary mt-2"
                  onClick={() => window.open("https://metamask.io/download.html", "_blank")}
                >
                  Download MetaMask
                </Button>
              </div>
            </div>
          )}

          {hasMetaMask === true && (
            <div className="w-full space-y-4">
              <Button
                size="lg"
                className="w-full"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                <img 
                  src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
                  alt="MetaMask" 
                  className="h-5 w-5 mr-2" 
                />
                {isConnecting ? "Connecting..." : "Connect with MetaMask"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                By connecting your wallet, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          )}

          {hasMetaMask === null && (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWallet;
