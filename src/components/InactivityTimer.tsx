
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useWill } from '@/contexts/WillContext';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const InactivityTimer = () => {
  const { lastActiveTime, isWillActive, updateLastActiveTime } = useWill();
  const [timeLeft, setTimeLeft] = useState<{ years: number; days: number; hours: number; minutes: number }>({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [progress, setProgress] = useState(100);

  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!isWillActive) return;

    const calculateTimeLeft = () => {
      const elapsed = Date.now() - lastActiveTime;
      const remaining = TWO_YEARS_MS - elapsed;
      
      if (remaining <= 0) {
        setTimeLeft({ years: 0, days: 0, hours: 0, minutes: 0 });
        setProgress(0);
        return;
      }

      const years = Math.floor(remaining / (365 * 24 * 60 * 60 * 1000));
      const days = Math.floor((remaining % (365 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

      setTimeLeft({ years, days, hours, minutes });
      
      // Calculate progress percentage
      const progressPercent = (remaining / TWO_YEARS_MS) * 100;
      setProgress(progressPercent);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [lastActiveTime, isWillActive]);

  if (!isWillActive) {
    return (
      <Card className="glass-card animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
            Will Execution Timer
          </CardTitle>
          <CardDescription>
            Activate your will to start the inactivity timer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 bg-muted/40 rounded-lg text-center">
            <div className="text-muted-foreground">
              Timer will start when you activate your will
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = () => {
    if (progress > 66) return "bg-emerald-500";
    if (progress > 33) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Clock className="mr-2 h-5 w-5 text-primary" />
          Will Execution Timer
        </CardTitle>
        <CardDescription>
          Time remaining before will execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold">{timeLeft.years}</div>
            <div className="text-xs text-muted-foreground">Years</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">Days</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold">{timeLeft.hours}</div>
            <div className="text-xs text-muted-foreground">Hours</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold">{timeLeft.minutes}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Time Elapsed</span>
            <span>{Math.round(100 - progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName={cn(getProgressColor())} />
        </div>

        <div className="bg-muted p-3 rounded-lg flex items-start text-sm">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-primary" />
          <div>
            <p>Your will becomes active after Depending on how you set it</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last activity: {new Date(lastActiveTime).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InactivityTimer;
