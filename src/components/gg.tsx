import { useState } from 'react';
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
import { AlertCircle, Lock, Plus, Unlock } from 'lucide-react';

interface Beneficiary {
  id: string;
  address: string;
  percentage: number;
  name?: string;
}

const WillForm = () => {
  const { isConnected, account } = useWallet();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [percentage, setPercentage] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isWillActive, setIsWillActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [willId, setWillId] = useState<number | null>(null); // Track the willId

  const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);

  const connectContract = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not detected",
        description: "Please install MetaMask to use this feature",
        variant: "destructive",
      });
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  };

  const handleDepositFunds = async () => {
    try {
      const contract = await connectContract();
      if (!contract) return;
  
      // Convert depositAmount to wei
      const depositAmountWei = ethers.parseEther(depositAmount);
  
      // Set inactivity threshold to 10 seconds for testing
      const inactivityThreshold = BigInt(10); // Convert to BigInt
      const tx = await contract.depositFunds(inactivityThreshold, { value: depositAmountWei });
      await tx.wait();
  
      // Fetch the willId from the contract
      const willCount = await contract.getNumberOfWills(account);
      const newWillId = Number(willCount) - 1; // Convert BigInt to number
      setWillId(newWillId);
  
      toast({
        title: "Funds deposited",
        description: `You have deposited ${depositAmount} ETH into your will.`,
      });
  
      // Call handleDistributeFunds after 10 seconds
      setTimeout(() => {
        handleDistributeFunds(newWillId);
      }, 10000); // 10 seconds
    } catch (error) {
      console.error('Error depositing funds:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deposit funds",
        variant: "destructive",
      });
    }
  };

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!address.trim()) {
        toast({
          title: "Address required",
          description: "Please enter a wallet address",
          variant: "destructive",
        });
        return;
      }

      if (!percentage.trim() || isNaN(Number(percentage)) || Number(percentage) <= 0) {
        toast({
          title: "Invalid percentage",
          description: "Please enter a valid percentage greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Check if adding this beneficiary would exceed 100%
      const percentValue = Number(percentage);
      const newTotal = totalPercentage + percentValue;
      if (newTotal > 100) {
        toast({
          title: "Percentage exceeds 100%",
          description: `Total allocation would be ${newTotal}%. Please adjust the percentage.`,
          variant: "destructive",
        });
        return;
      }

      // Check if address is valid (basic check - should be 42 chars long including 0x)
      if (!address.startsWith('0x') || address.length !== 42) {
        toast({
          title: "Invalid address",
          description: "Please enter a valid Ethereum wallet address",
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

      // Connect to the contract
      const contract = await connectContract();
      if (!contract || willId === null) return;

      console.log("Adding beneficiary to contract...");
      const tx = await contract.addBeneficiary(willId, address, percentValue);
      console.log("Transaction sent:", tx);

      await tx.wait(); // Wait for the transaction to be mined
      console.log("Transaction confirmed");

      // Add beneficiary to local state
      setBeneficiaries((prev) => [
        ...prev,
        { id: Math.random().toString(), address, percentage: percentValue, name: name.trim() || undefined },
      ]);

      // Reset form
      setName('');
      setAddress('');
      setPercentage('');

      toast({
        title: "Beneficiary added",
        description: `${name || address} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add beneficiary",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDistributeFunds = async (willId: number) => {
    try {
      const contract = await connectContract();
      if (!contract) return;

      // Call the checkAndDistributeFunds function
      const tx = await contract.checkAndDistributeFunds(willId);
      await tx.wait();

      toast({
        title: "Funds distributed",
        description: "Funds have been distributed to beneficiaries.",
      });
    } catch (error) {
      console.error('Error distributing funds:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to distribute funds",
        variant: "destructive",
      });
    }
  };

  const toggleWillActive = async () => {
    try {
      const contract = await connectContract();
      if (!contract || willId === null) return;

      if (isWillActive) {
        console.log("Deactivating will...");
        const tx = await contract.deactivateWill(willId);
        console.log("Deactivation transaction sent:", tx);
        await tx.wait();
        console.log("Deactivation transaction confirmed");
      } else {
        console.log("Activating will...");
        const tx = await contract.activateWill(willId);
        console.log("Activation transaction sent:", tx);
        await tx.wait();
        console.log("Activation transaction confirmed");

        // Call handleDistributeFunds after 10 seconds
        setTimeout(() => {
          handleDistributeFunds(willId);
        }, 10000); // 10 seconds
      }

      setIsWillActive((prev) => !prev);
      toast({
        title: isWillActive ? "Will deactivated" : "Will activated",
        description: isWillActive
          ? "Your will has been deactivated."
          : "Your will is now active.",
      });
    } catch (error) {
      console.error('Error toggling will:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle will",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-lg mx-auto glass-card animate-fade-in">
        <CardHeader>
          <CardTitle>Create Your Will</CardTitle>
          <CardDescription>
            Connect your wallet to start creating your will
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="glass-card animate-slide-up mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Crypto Will</CardTitle>
              <CardDescription>
                Deposit funds and add beneficiaries to create your will
              </CardDescription>
            </div>
            <Button 
              variant={isWillActive ? "destructive" : "default"}
              onClick={toggleWillActive}
              disabled={isWillActive ? false : totalPercentage !== 100 || beneficiaries.length === 0}
              className="transition-all"
            >
              {isWillActive ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Deactivate Will
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Activate Will
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Deposit Funds Section */}
          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
              <CardDescription>
                Specify the amount you want to allocate as your will.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleDepositFunds(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Amount (ETH)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="Enter the amount to deposit"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Deposit Funds
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Add Beneficiary Section */}
          <Card>
            <CardHeader>
              <CardTitle>Add Beneficiary</CardTitle>
              <CardDescription>
                Add beneficiaries and specify their allocation percentages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBeneficiary} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Beneficiary Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="Enter a name for reference"
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentage">
                    Allocation Percentage
                    {totalPercentage < 100 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Suggested: {100 - totalPercentage}%)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="1"
                    max={100 - totalPercentage}
                    placeholder="Enter percentage"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || totalPercentage >= 100}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Beneficiary
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Beneficiaries List */}
          {beneficiaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Beneficiaries</CardTitle>
                <CardDescription>
                  List of beneficiaries and their allocation percentages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {beneficiaries.map((beneficiary) => (
                    <div key={beneficiary.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{beneficiary.name || beneficiary.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {beneficiary.percentage}% allocation
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isWillActive}
                          onClick={() => setBeneficiaries((prev) => prev.filter((b) => b.id !== beneficiary.id))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WillForm;