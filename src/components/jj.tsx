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
  const [isWillActive, setIsWillActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (!contract) return;

      // Add beneficiary to the contract
      const tx = await contract.addBeneficiary(address, percentValue);
      await tx.wait();

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
        description: "Failed to add beneficiary",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWillActive = async () => {
    try {
      const contract = await connectContract();
      if (!contract) return;

      if (isWillActive) {
        const tx = await contract.deactivateWill();
        await tx.wait();
      } else {
        const tx = await contract.activateWill();
        await tx.wait();
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
        description: "Failed to toggle will",
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
                Add beneficiaries and set their allocation percentages
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                Allocation: {totalPercentage}% of 100%
              </div>
              <div className="text-sm text-muted-foreground">
                Remaining: {100 - totalPercentage}%
              </div>
            </div>
            <Progress value={totalPercentage} className="h-2" />
          </div>

          {beneficiaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-muted/40 rounded-lg">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No beneficiaries added yet</p>
                <p className="text-sm text-muted-foreground">Add your first beneficiary below</p>
              </div>
            </div>
          ) : (
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
          )}

          {isWillActive ? (
            <div className="bg-muted p-4 rounded-lg text-sm">
              <div className="flex items-start">
                <Lock className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Will is active</p>
                  <p className="text-muted-foreground">
                    Your will is active and will execute after 1 year of inactivity.
                    Deactivate to make changes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddBeneficiary} className="space-y-4 pt-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WillForm;