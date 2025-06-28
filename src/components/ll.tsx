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
import { AlertCircle, Lock, Plus, Unlock, Clock, UserCheck } from 'lucide-react';

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

  const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);

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

  const loadUserData = async () => {
    if (!account || !provider) return;
    
    setIsLoading(true);
    try {
      const contract = await connectContract();
      if (!contract) return;

      const user = await contract.users(account);
      if (user.owner !== ethers.ZeroAddress) {
        setIsRegistered(true);
        setInactivityPeriod(user.inactivityPeriod.toString());
        setLastCheckIn(new Date(Number(user.lastCheckIn) * 1000));
        
        const balance = ethers.formatEther(user.balance);
        setUserBalance(balance);

        // Note: Loading beneficiaries from contract would require additional functions
        // For now, we'll manage them in component state
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && account) {
      loadUserData();
    }
  }, [isConnected, account]);

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
      toast({
        title: "Registration successful",
        description: `Your will is now active with ${inactivityPeriod} days inactivity period.`,
      });
    } catch (error: any) {
      console.error('Error registering:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not register",
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

      const tx = await contract.checkIn();
      await tx.wait();

      setLastCheckIn(new Date());
      toast({
        title: "Check-in successful",
        description: "Your activity timer has been reset.",
      });
    } catch (error: unknown) {
      console.error('Error checking in:', error);
      toast({
        title: "Check-in failed",
        description: error.message || "Could not check in",
        variant: "destructive",
      });
    }
  };

  const handleDeposit = async () => {
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

      const amountWei = ethers.parseEther(depositAmount);
      const tx = await contract.depositFunds({ value: amountWei });
      await tx.wait();

      await loadUserData();
      toast({
        title: "Deposit successful",
        description: `${depositAmount} ETH has been added to your will.`,
      });
      setDepositAmount('');
    } catch (error: unknown) {
      console.error('Error depositing:', error);
      toast({
        title: "Deposit failed",
        description: error.message || "Could not deposit funds",
        variant: "destructive",
      });
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

      const tx = await contract.withdraw();
      await tx.wait();

      await loadUserData();
      toast({
        title: "Withdrawal successful",
        description: "Funds have been withdrawn from your will.",
      });
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast({
        title: "Withdrawal failed",
        description: error.message || "Could not withdraw funds",
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

      const tx = await contract.updateBeneficiaries(addresses, percentages);
      await tx.wait();

      toast({
        title: "Beneficiaries updated",
        description: "Your beneficiaries list has been saved.",
      });
    } catch (error: unknown) {
      console.error('Error updating beneficiaries:', error);
      toast({
        title: "Update failed",
        description: error.message || "Could not update beneficiaries",
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
  
    // Prevent adding own wallet as beneficiary
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
  }

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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
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
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleCheckIn} 
                  className="w-full"
                  disabled={isLoading}
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
                  />
                  <Button 
                    onClick={handleDeposit} 
                    className="w-full"
                    disabled={!depositAmount || isLoading}
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
                    disabled={parseFloat(userBalance) <= 0 || isLoading}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Wallet Address</Label>
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
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
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={totalPercentage >= 100}
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
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleUpdateBeneficiaries}
                    className="w-full"
                    disabled={totalPercentage !== 100 || isLoading}
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