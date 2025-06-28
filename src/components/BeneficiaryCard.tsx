
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Beneficiary } from '@/contexts/WillContext';
import { Trash2, Edit2, Save, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onUpdate: (data: Partial<Beneficiary>) => void;
  onRemove: () => void;
  isLocked: boolean;
}

const BeneficiaryCard = ({ beneficiary, onUpdate, onRemove, isLocked }: BeneficiaryCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(beneficiary.name || '');
  const [percentage, setPercentage] = useState(beneficiary.percentage.toString());

  const handleSave = () => {
    onUpdate({
      name: name || undefined,
      percentage: Number(percentage),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(beneficiary.name || '');
    setPercentage(beneficiary.percentage.toString());
    setIsEditing(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className={cn(
      "bg-background rounded-lg border p-4 transition-all",
      isEditing ? "shadow-md" : "",
      isLocked ? "opacity-85" : ""
    )}>
      {isEditing ? (
        <div className="space-y-3 animate-fade-in">
          <div className="space-y-1">
            <Label htmlFor={`name-${beneficiary.id}`} className="text-xs">Name</Label>
            <Input
              id={`name-${beneficiary.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name (optional)"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor={`percentage-${beneficiary.id}`} className="text-xs">Percentage</Label>
            <Input
              id={`percentage-${beneficiary.id}`}
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              min="1"
              max="100"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {beneficiary.name || truncateAddress(beneficiary.address)}
              </p>
              <p className="text-xs text-muted-foreground">
                {beneficiary.address}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="font-medium text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              {beneficiary.percentage}%
            </span>
            
            {!isLocked && (
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BeneficiaryCard;
