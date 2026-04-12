import { useState, useEffect } from "react";
import { useListRespondents, useCreateSession, useGetSession, useGetDeviceStatus } from "@workspace/api-client-react";
import { Wind, Play, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

const STEPS = ["pending", "purging", "ready", "sampling", "completed"];

export default function NewSession() {
  const [selectedRespondentId, setSelectedRespondentId] = useState<number | "">("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [_, setLocation] = useLocation();
  
  const { toast } = useToast();
  
  const { data: respondents, isLoading: isLoadingRespondents } = useListRespondents();
  const { data: deviceStatus } = useGetDeviceStatus({ query: { refetchInterval: 2000 } });
  
  const { mutateAsync: createSession, isPending: isCreating } = useCreateSession();
  
  // Poll active session if it exists
  const { data: session } = useGetSession(activeSessionId as number, {
    query: { 
      enabled: !!activeSessionId,
      refetchInterval: (data) => 
        (data?.state === 'completed' || data?.state === 'error') ? false : 1500
    }
  });

  const isDeviceReady = deviceStatus?.isOnline;

  const handleStartSession = async () => {
    if (!selectedRespondentId) return;
    if (!isDeviceReady) {
      toast({ title: "Device Offline", description: "Please ensure the Pico 2W device is connected before starting.", variant: "destructive" });
      return;
    }

    try {
      const newSession = await createSession({ data: { respondentId: Number(selectedRespondentId) } });
      setActiveSessionId(newSession.id);
      toast({ title: "Session Started", description: "Command sent to device." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to start session", variant: "destructive" });
    }
  };

  const currentStateIndex = session ? STEPS.indexOf(session.state) : -1;
  const isError = session?.state === 'error';

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
          <Wind className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">New Breath Sample</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          Start a new data collection sequence. The device will purge the chamber, then read sensor values for 30-60 seconds.
        </p>
      </div>

      {!activeSessionId ? (
        <Card className="p-8 rounded-3xl border border-border/50 shadow-lg shadow-black/5 bg-card relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Select Respondent</label>
              <select 
                value={selectedRespondentId} 
                onChange={(e) => setSelectedRespondentId(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground appearance-none shadow-sm"
              >
                <option value="" disabled>-- Choose a test subject --</option>
                {isLoadingRespondents ? (
                  <option disabled>Loading...</option>
                ) : (
                  respondents?.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (ID: #{r.id}, {r.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={`p-4 rounded-xl border flex gap-3 text-sm ${isDeviceReady ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              <Info className={`w-5 h-5 shrink-0 ${isDeviceReady ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <p className="font-semibold mb-0.5">{isDeviceReady ? "Device Ready" : "Device Offline"}</p>
                <p className="opacity-90">
                  {isDeviceReady 
                    ? "The Pico 2W is connected and waiting for instructions." 
                    : "Waiting for the Pico 2W to connect to the network. Please power it on."}
                </p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full text-lg h-14 rounded-xl hover-elevate shadow-xl shadow-primary/25"
              onClick={handleStartSession}
              disabled={!selectedRespondentId || isCreating || !isDeviceReady}
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              Start Sampling Sequence
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-8 rounded-3xl border border-border/50 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 text-center space-y-8">
            <h2 className="font-display text-2xl font-bold">Session #{session?.sessionNumber || '...'} in progress</h2>
            
            <div className="relative max-w-xl mx-auto py-8">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 rounded-full overflow-hidden z-0">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-in-out"
                  style={{ width: `${Math.max(5, (currentStateIndex / (STEPS.length - 1)) * 100)}%` }}
                />
              </div>
              
              <div className="relative z-10 flex justify-between">
                {STEPS.map((step, idx) => {
                  const isPast = idx < currentStateIndex;
                  const isCurrent = idx === currentStateIndex;
                  const isErrorState = isError && isCurrent;
                  
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-sm
                        ${isPast ? 'bg-primary border-primary text-white' : 
                          isCurrent ? (isErrorState ? 'bg-destructive border-destructive text-white' : 'bg-background border-primary text-primary animate-pulse shadow-primary/50 shadow-lg') : 
                          'bg-background border-muted text-muted-foreground'
                        }
                      `}>
                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : 
                         isErrorState ? <AlertCircle className="w-5 h-5" /> :
                         <span className="font-bold text-sm">{idx + 1}</span>}
                      </div>
                      <span className={`mt-3 text-xs font-semibold uppercase tracking-wider ${isCurrent ? (isErrorState ? 'text-destructive' : 'text-primary') : 'text-muted-foreground'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border shadow-sm rounded-2xl p-6 text-left max-w-md mx-auto">
              <h3 className="font-bold text-lg mb-2">Current Status</h3>
              {session?.state === 'pending' && <p className="text-muted-foreground">Waiting for device to acknowledge command...</p>}
              {session?.state === 'purging' && <p className="text-muted-foreground">Pump is running to clear the chamber of residual gases. Please wait...</p>}
              {session?.state === 'ready' && <p className="text-muted-foreground font-medium text-emerald-600">Chamber is clean. Ready for breath sample.</p>}
              {session?.state === 'sampling' && (
                <div className="space-y-3">
                  <p className="text-primary font-medium flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reading sensors...
                  </p>
                  <p className="text-sm text-muted-foreground">Please blow steadily into the mouthpiece.</p>
                </div>
              )}
              {session?.state === 'completed' && (
                <div className="space-y-4">
                  <p className="text-emerald-600 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Collection complete!
                  </p>
                  <Button className="w-full" onClick={() => setLocation(`/respondents/${session.respondentId}`)}>
                    View Results
                  </Button>
                </div>
              )}
              {session?.state === 'error' && (
                <div className="space-y-4">
                  <p className="text-destructive font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Device reported an error
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setActiveSessionId(null)}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
            
            {session?.state !== 'completed' && session?.state !== 'error' && (
              <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => {
                if(confirm("Cancel this session? The device might need to be reset.")) {
                  setActiveSessionId(null);
                }
              }}>
                Cancel Session
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
