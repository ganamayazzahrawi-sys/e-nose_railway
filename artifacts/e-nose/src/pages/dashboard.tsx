import { useListRespondents, useListSessions } from "@workspace/api-client-react";
import { Users, Activity, CheckCircle2, TrendingUp, AlertCircle, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: respondents, isLoading: isLoadingRespondents } = useListRespondents();
  const { data: sessions, isLoading: isLoadingSessions } = useListSessions();

  const totalRespondents = respondents?.length || 0;
  const diabetesCount = respondents?.filter(r => r.status === "diabetes").length || 0;
  const nonDiabetesCount = totalRespondents - diabetesCount;
  
  const totalSessions = sessions?.length || 0;
  const completedSessions = sessions?.filter(s => s.state === "completed").length || 0;
  
  const recentSessions = sessions?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3) || [];

  if (isLoadingRespondents || isLoadingSessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor your breath sampling research progress.</p>
        </div>
        <Link href="/sessions/new">
          <Button className="hover-elevate shadow-lg shadow-primary/20 rounded-xl px-6">
            <Activity className="w-4 h-4 mr-2" />
            Start New Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Respondents</p>
              <h3 className="text-3xl font-display font-bold">{totalRespondents}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            <span className="text-emerald-500 font-medium mr-1">{diabetesCount}</span> diabetes •
            <span className="text-blue-500 font-medium ml-1">{nonDiabetesCount}</span> non-diabetes
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Completed Sessions</p>
              <h3 className="text-3xl font-display font-bold">{completedSessions}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            Out of {totalSessions} total attempts
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-card to-muted/30">
          <div className="absolute right-0 top-0 w-48 h-48 bg-secondary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex items-start justify-between h-full flex-col">
            <div className="flex items-center gap-3 w-full">
              <div className="p-3 bg-secondary/10 text-secondary rounded-xl shrink-0">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">E-Nose System Ready</p>
                <h3 className="text-lg font-display font-semibold">Ready for next breath sample</h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground max-w-md">
              Ensure the chamber is purged before each session. The device requires 30 seconds for optimal baseline reading.
            </div>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">Recent Sessions</h2>
          <Link href="/data" className="text-sm text-primary hover:underline font-medium">View all data &rarr;</Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recentSessions.length === 0 ? (
            <Card className="col-span-3 p-12 text-center border-dashed flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No sessions yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mt-2">Add a respondent and start a sampling session to see data here.</p>
              <Link href="/sessions/new">
                <Button>Start First Session</Button>
              </Link>
            </Card>
          ) : (
            recentSessions.map(session => (
              <Card key={session.id} className="p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-muted text-muted-foreground mb-2 inline-block">
                      Session #{session.sessionNumber}
                    </span>
                    <h3 className="font-semibold text-base line-clamp-1">{session.respondent.name}</h3>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    session.state === 'completed' ? 'bg-emerald-500' : 
                    session.state === 'error' ? 'bg-destructive' : 'bg-amber-500 animate-pulse'
                  }`} />
                </div>
                
                {session.state === 'completed' ? (
                  <div className="grid grid-cols-2 gap-2 text-sm mt-4 p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="text-muted-foreground text-xs">Acetone</p>
                      <p className="font-mono font-medium text-primary">{session.mq138AcetonePpm?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">VOC</p>
                      <p className="font-mono font-medium">{session.tgs2602Voc?.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-sm flex items-center gap-2 font-medium">
                    <Activity className="w-4 h-4" />
                    Status: <span className="capitalize">{session.state}</span>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-muted-foreground border-t pt-3 flex justify-between">
                  <span>{formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</span>
                  <Link href={`/respondents/${session.respondentId}`} className="text-primary hover:underline font-medium">
                    Details
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
