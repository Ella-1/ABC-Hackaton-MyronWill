import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from '@/components/ui/use-toast';

export interface UseWalletReturn {
  account: string | null;
  balance: string | null;
  chainId: string | null;
  provider: ethers.BrowserProvider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  isConnected: boolean;
}

export function useWallet(): UseWalletReturn {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const ethereum = typeof window !== 'undefined' ? window.ethereum : undefined;

  const getBalance = useCallback(async (address: string) => {
    if (!ethereum) return;
    
    try {
      const balanceHex = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
      const balanceInWei = parseInt(balanceHex, 16);
      const balanceInEth = balanceInWei / 1e18;
      setBalance(balanceInEth.toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  }, [ethereum]);

  const connectWallet = useCallback(async () => {
    if (!ethereum) {
      toast({
        title: "MetaMask not detected",
        description: "Please install MetaMask to use this feature",
        variant: "destructive",
      });
      return;
    }
  
    setIsConnecting(true);
  
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        getBalance(accounts[0]);
  
        let chainIdHex = await ethereum.request({ method: 'eth_chainId' });
  
        if (chainIdHex !== '0x279F') { // Check if NOT on Monad Testnet
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x279F' }], // Switch to Monad Testnet
            });
  
            // Wait & re-fetch the chain ID after switching
            chainIdHex = await ethereum.request({ method: 'eth_chainId' });
  
          } catch (switchError: any) {
            console.error("Switch Error:", switchError);
  
            if (switchError.code === 4902) {
              // If Monad Testnet is not added, request to add it
              try {
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x279F',
                      chainName: 'Monad Testnet',
                      nativeCurrency: {
                        name: 'MON',
                        symbol: 'MON',
                        decimals: 18,
                      },
                      rpcUrls: ['https://testnet-rpc.monad.xyz'],
                      blockExplorerUrls: ['https://testnet.monadexplorer.com'],
                    },
                  ],
                });
  
                // Re-fetch chain ID after adding
                chainIdHex = await ethereum.request({ method: 'eth_chainId' });
  
              } catch (addError) {
                console.error("Error adding Monad Testnet:", addError);
                toast({
                  title: "Failed to Add Monad Testnet",
                  description: "Please add it manually in MetaMask.",
                  variant: "destructive",
                });
                return;
              }
            } else {
              toast({
                title: "Wrong Network",
                description: "Please switch to Monad Testnet manually.",
                variant: "destructive",
              });
              return;
            }
          }
        }
  
        if (chainIdHex === '0x279F') {
          setChainId(chainIdHex);
          setProvider(new ethers.BrowserProvider(ethereum));
  
          toast({
            title: "Wallet Connected",
            description: "Connected to Monad Testnet successfully!",
          });
        } else {
          toast({
            title: "Network Error",
            description: "Failed to switch to Monad Testnet.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Connection Error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [ethereum, getBalance]);
  
  

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setProvider(null);
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  }, []);

  useEffect(() => {
    if (!ethereum) return;

    const checkConnection = async () => {
      try {
        const accounts = await ethereum.request({
          method: 'eth_accounts',
        });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          getBalance(accounts[0]);
          
          const chainIdHex = await ethereum.request({
            method: 'eth_chainId',
          });
          setChainId(chainIdHex);

          // Initialize provider
          const web3Provider = new ethers.BrowserProvider(ethereum);
          setProvider(web3Provider);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();
  }, [ethereum, getBalance]);

  useEffect(() => {
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        getBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(chainId);
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, disconnectWallet, ethereum, getBalance]);

  return {
    account,
    balance,
    chainId,
    provider,
    connectWallet,
    disconnectWallet,
    isConnecting,
    isConnected: !!account,
  };
}