// src/components/WillForm.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from './Contracts';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Lock, Plus, Unlock, Clock, UserCheck, Loader2 } from 'lucide-react';

interface Beneficiary {
  address: string;
  percentage: number;
  name?: string;
}

const WillForm = () => {
  const { 
    account, 
    isConnected, 
    provider,
    isConnecting: isWalletConnecting 
  } = useWallet();
  
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [percentage, setPercentage] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [inactivityPeriod, setInactivityPeriod] = useState('30');
  const [isRegistered, setIsRegistered] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [willId, setWillId] = useState<number>(1);
  const [isActive, setIsActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [distributionHash, setDistributionHash] = useState<string|null>(null);

  const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const connectContract = async () => {
    if (!provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return null;
    }

    try {
      const signer = await provider.getSigner();
      return new ethers.Contract(contractAddress, contractABI, signer);
    } catch (error) {
      console.error('Error connecting to contract:', error);
      toast({
        title: "Connection error",
        description: "Failed to connect to contract",
        variant: "destructive",
      });
      return null;
    }
  };

  const deactivateWill = async () => {
    if (!isConnected || !provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
  
    setIsLoading(true);
    try {
      const contract = await connectContract();
      if (!contract) return;
  
      const tx = await contract.deactivateWill(willId);
      await tx.wait();
  
      toast({
        title: "Will deactivated",
        description: "Your will has been manually deactivated",
      });
  
      // Refresh data
      await loadUserData();
    } catch (error: any) {
      console.error('Deactivation failed:', error);
      toast({
        title: "Deactivation failed",
        description: error.reason || error.message || "Could not deactivate will",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!account || !provider) return;
    
    setIsLoading(true);
    try {
      const contract = await connectContract();
      if (!contract) return;

      // Get active will ID
      const activeWillId = await contract.getActiveWillId(account);
      if (activeWillId === 0) {
        setIsRegistered(false);
        return;
      }

      setWillId(activeWillId);

      // Get will info
      const [checkInTime, period, balance, active] = await contract.getUserWillInfo(account, activeWillId);
      const [beneficiaryAddresses, beneficiaryPercentages] = await contract.getBeneficiaries(account, activeWillId);

      // Format beneficiaries for frontend
      const formattedBeneficiaries = beneficiaryAddresses.map((addr, i) => ({
        address: addr,
        percentage: Number(beneficiaryPercentages[i]),
        name: ''
      }));

      // Update state
      setIsRegistered(true);
      setIsActive(active);
      setInactivityPeriod((Number(period) / (24 * 60 * 60)).toString());
      setLastCheckIn(new Date(Number(checkInTime) * 1000));
      setUserBalance(ethers.formatEther(balance));
      setBeneficiaries(formattedBeneficiaries);

      // Cache data in localStorage
      localStorage.setItem(`will_${account}`, JSON.stringify({
        inactivityPeriod: (Number(period) / (24 * 60 * 60)).toString(),
        beneficiaries: formattedBeneficiaries,
        lastCheckIn: Number(checkInTime) * 1000,
        balance: ethers.formatEther(balance),
        willId: activeWillId,
        active
      }));

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Loading error",
        description: "Could not load will data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isConnected && account) {
      loadUserData();
    }
  }, [isConnected, account]);

  const executeTransfer = async () => {
    if (!isConnected || !provider || !account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const contract = await connectContract();
      if (!contract) return;

      // Verify conditions are met
      const will = await contract.wills(account, willId);
      const currentTime = Math.floor(Date.now() / 1000);
      const lastCheckInTime = Number(will.lastCheckIn);
      const inactivityPeriodSec = Number(will.inactivityPeriod);
      
      // For demo purposes, we override the check
      const isInactive = demoMode ? true : currentTime > lastCheckInTime + inactivityPeriodSec;
      
      if (!isInactive) {
        toast({
          title: "Cannot distribute yet",
          description: "Inactivity period has not elapsed",
          variant: "destructive",
        });
        return;
      }

      if (Number(will.balance) <= 0) {
        toast({
          title: "No funds to distribute",
          description: "The will has no balance",
          variant: "destructive",
        });
        return;
      }

      // Execute the transfer
      const tx = await contract.executeTransfer(account, willId);
      setDistributionHash(tx.hash);
      
      await tx.wait();

      toast({
        title: "Distribution successful",
        description: "Funds have been distributed to beneficiaries",
      });

      // Refresh data
      await loadUserData();
    } catch (error: any) {
      console.error('Distribution failed:', error);
      toast({
        title: "Distribution failed",
        description: error.reason || error.message || "Could not distribute funds",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCountdown(0);
    }
  };

  const handleRegister = async () => {
    if (!isConnected || !provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const contract = await connectContract();
      if (!contract) return;

      const periodInSeconds = parseInt(inactivityPeriod) * 24 * 60 * 60;
      const tx = await contract.register(periodInSeconds);
      await tx.wait();

      setIsRegistered(true);
      setIsActive(true);
      setLastCheckIn(new Date());
      toast({
        title: "Registration successful",
        description: `Your will is now active with ${inactivityPeriod} days inactivity period.`,
      });
      
      // Reload data
      await loadUserData();
    } catch (error: any) {
      console.error('Error registering:', error);
      toast({
        title: "Registration failed",
        description: error.reason || error.message || "Could not register",
        variant: "destructive",
      });
    }
  };

  const handleCheckIn = async () => {
    if (!isConnected || !provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const contract = await connectContract();
      if (!contract) return;

      const tx = await contract.checkIn(willId);
      await tx.wait();

      setLastCheckIn(new Date());
      toast({
        title: "Check-in successful",
        description: "Your activity timer has been reset.",
      });
      
      // Reload data
      await loadUserData();
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast({
        title: "Check-in failed",
        description: error.reason || error.message || "Could not check in",
        variant: "destructive",
      });
    }
  };

  const handleDeposit = async () => {
    if (!isConnected || !provider || !account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
  
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
  
    setIsLoading(true);
    try {
      const contract = await connectContract();
      if (!contract) return;
  
      const amountWei = ethers.parseEther(depositAmount);
      
      const tx = await contract.depositFunds(willId, { 
        value: amountWei,
        gasLimit: 300000
      });
  
      toast({
        title: "Transaction pending",
        description: "Your deposit is being processed...",
        duration: 5000,
      });
  
      await tx.wait();
      
      // Update local balance immediately
      setUserBalance(prev => (Number(prev) + Number(depositAmount)).toString());
      
      toast({
        title: "Deposit successful!",
        description: `${depositAmount} ETH has been added to your will.`,
      });
      setDepositAmount('');
      
      // Reload data
      await loadUserData();
  
    } catch (error: any) {
      console.error('Deposit failed:', error);
      
      let errorMessage = "Deposit failed";
      if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient balance for this transaction";
      } else if (error.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      toast({
        title: "Deposit failed",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const contract = await connectContract();
      if (!contract) return;

      const tx = await contract.withdraw(willId);
      await tx.wait();

      setUserBalance('0');
      toast({
        title: "Withdrawal successful",
        description: "Funds have been withdrawn from your will.",
      });
      
      // Reload data
      await loadUserData();
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast({
        title: "Withdrawal failed",
        description: error.reason || error.message || "Could not withdraw funds",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBeneficiaries = async () => {
    if (!isConnected || !provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const contract = await connectContract();
      if (!contract) return;

      const addresses = beneficiaries.map(b => b.address);
      const percentages = beneficiaries.map(b => b.percentage);

      const tx = await contract.updateBeneficiaries(
        willId,
        addresses,
        percentages
      );
      await tx.wait();

      toast({
        title: "Beneficiaries updated",
        description: demoMode 
          ? "Your beneficiaries list has been saved. Demo distribution will execute in 10 seconds." 
          : "Your beneficiaries list has been saved.",
      });

      // Schedule automatic execution after 10 seconds in demo mode
      if (demoMode) {
        setCountdown(10);
        setTimeout(() => {
          toast({
            title: "Executing Demo Distribution",
            description: "Automatically distributing funds to beneficiaries for demo purposes",
          });
          executeTransfer();
        }, 10000);
      }
    } catch (error: any) {
      console.error('Error updating beneficiaries:', error);
      toast({
        title: "Update failed",
        description: error.reason || error.message || "Could not update beneficiaries",
        variant: "destructive",
      });
    }
  };

  const addBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.startsWith('0x') || address.length !== 42) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }
  
    if (account && address.toLowerCase() === account.toLowerCase()) {
      toast({
        title: "Invalid beneficiary",
        description: "You cannot add your own wallet as a beneficiary",
        variant: "destructive",
      });
      return;
    }
  
    const percent = parseInt(percentage);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      toast({
        title: "Invalid percentage",
        description: "Please enter a value between 1 and 100",
        variant: "destructive",
      });
      return;
    }
  
    if (totalPercentage + percent > 100) {
      toast({
        title: "Total exceeds 100%",
        description: `Current total: ${totalPercentage}%. You can add up to ${100 - totalPercentage}%.`,
        variant: "destructive",
      });
      return;
    }
  
    setBeneficiaries(prev => [
      ...prev,
      { address, percentage: percent, name: name || undefined }
    ]);
  
    setName('');
    setAddress('');
    setPercentage('');
  };

  const removeBeneficiary = (index: number) => {
    setBeneficiaries(prev => prev.filter((_, i) => i !== index));
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Create Your Will</CardTitle>
          <CardDescription>
            Connect your wallet to start creating your will
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => useWallet().connectWallet()}
            disabled={isWalletConnecting}
            className="w-full"
          >
            {isWalletConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Demo Mode Toggle */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setDemoMode(!demoMode)}
          variant={demoMode ? "default" : "outline"}
          size="sm"
        >
          {demoMode ? "Demo Mode: ON" : "Demo Mode: OFF"}
        </Button>
      </div>

      {/* Registration Section */}
      {!isRegistered ? (
        <Card>
          <CardHeader>
            <CardTitle>Register Your Will</CardTitle>
            <CardDescription>
              Set up your inactivity period to activate your crypto will
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inactivityPeriod">Inactivity Period (days)</Label>
              <Input
                id="inactivityPeriod"
                type="number"
                min="1"
                value={inactivityPeriod}
                onChange={(e) => setInactivityPeriod(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleRegister} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Register Will"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Will Status</CardTitle>
              <CardDescription>
                Will ID: {willId} | Status: {isActive ? (
                  <span className="text-green-500">Active</span>
                ) : (
                  <span className="text-red-500">Inactive</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactivity Period</p>
                  <p className="font-medium">{inactivityPeriod} days</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <UserCheck className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Check-in</p>
                  <p className="font-medium">
                    {lastCheckIn ? lastCheckIn.toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Lock className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Funds Protected</p>
                  <p className="font-medium">{userBalance} ETH</p>
                </div>
              </div>

              <Button 
  onClick={deactivateWill}
  className="w-full mt-2"
  variant="outline"
  disabled={!isActive || isLoading}
>
  {isLoading ? "Processing..." : "Deactivate Will"}
</Button>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleCheckIn} 
                  className="w-full"
                  disabled={isLoading || !isActive}
                >
                  {isLoading ? "Processing..." : "Check In Now"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deposit/Withdraw Section */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Funds</CardTitle>
              <CardDescription>
                Deposit or withdraw funds from your will
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (ETH)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={!isActive}
                  />
                  <Button 
                    onClick={handleDeposit} 
                    className="w-full"
                    disabled={!depositAmount || isLoading || !isActive}
                  >
                    {isLoading ? "Processing..." : "Deposit"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Current Balance: {userBalance} ETH</Label>
                  <Button 
                    onClick={handleWithdraw} 
                    className="w-full"
                    variant="outline"
                    disabled={parseFloat(userBalance) <= 0 || isLoading || !isActive}
                  >
                    {isLoading ? "Processing..." : "Withdraw All"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beneficiaries Section */}
          <Card>
            <CardHeader>
              <CardTitle>Beneficiaries</CardTitle>
              <CardDescription>
                Add beneficiaries and specify their allocation percentages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={addBeneficiary} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isActive}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Wallet Address</Label>
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={!isActive}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Percentage</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="1"
                      max={100 - totalPercentage}
                      placeholder="10"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      disabled={!isActive}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={totalPercentage >= 100 || !isActive}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Beneficiary
                </Button>
              </form>

              {beneficiaries.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Current Beneficiaries</h3>
                    <span className="text-sm text-muted-foreground">
                      Total: {totalPercentage}%
                    </span>
                  </div>
                  <div className="border rounded-lg divide-y">
                    {beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {beneficiary.name || `${beneficiary.address.slice(0, 6)}...${beneficiary.address.slice(-4)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {beneficiary.percentage}% allocation
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBeneficiary(index)}
                          disabled={!isActive}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {countdown > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-center font-medium">
                        Demo Distribution in: {countdown} seconds
                      </p>
                      <Progress value={(10 - countdown) * 10} className="mt-2" />
                    </div>
                  )}

                  {distributionHash && (
                    <div className="text-sm mt-2 p-2 bg-green-50 rounded">
                      Distribution completed: 
                      <a 
                        href={`https://etherscan.io/tx/${distributionHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        View transaction
                      </a>
                    </div>
                  )}

                  <Button 
                    onClick={handleUpdateBeneficiaries}
                    className="w-full"
                    disabled={totalPercentage !== 100 || isLoading || !isActive}
                  >
                    {isLoading ? "Saving..." : "Save Beneficiaries"}
                  </Button>
                  
                  {totalPercentage !== 100 && (
                    <p className="text-sm text-center text-destructive">
                      Total allocation must equal 100% to save
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default WillForm;