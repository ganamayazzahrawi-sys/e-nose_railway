import { useGetRespondent } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Activity, Wind, Beaker, Calendar, Clock, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/export";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function RespondentDetail() {
  const { id } = useParams<{ id: string }>();
  const respondentId = parseInt(id || "0", 10);
  
  const { data: respondent, isLoading, isError } = useGetRespondent(respondentId, {
    query: { enabled: !!respondentId }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Loading patient data...</p>
      </div>
    );
  }

  if (isError || !respondent) {
    return (
      <div className="p-12 text-center bg-destructive/5 rounded-2xl border border-destructive/20 text-destructive">
        Respondent not found or error loading data.
        <br/>
        <Link href="/respondents" className="underline mt-4 inline-block font-medium">Return to list</Link>
      </div>
    );
  }

  const completedSessions = respondent.sessions.filter(s => s.state === 'completed');
  
  // Format data for Recharts (latest completed session if exists)
  const latestSession = completedSessions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const chartData = latestSession ? [
    { name: 'Alcohol', value: latestSession.mq3AlcoholPpm, full: 'MQ-3 (Alcohol)' },
    { name: 'Methane', value: latestSession.mq4MethanePpm, full: 'MQ-4 (Methane)' },
    { name: 'Acetone', value: latestSession.mq138AcetonePpm, full: 'MQ-138 (Acetone)' },
    { name: 'VOC', value: latestSession.tgs2602Voc, full: 'TGS-2602 (VOC)' },
  ] : [];

  const handleExport = () => {
    if (!completedSessions.length) return;
    
    const exportData = completedSessions.map(s => ({
      Session_Number: s.sessionNumber,
      Date: format(new Date(s.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      MQ3_Alcohol_PPM: s.mq3AlcoholPpm,
      MQ4_Methane_PPM: s.mq4MethanePpm,
      MQ138_Acetone_PPM: s.mq138AcetonePpm,
      TGS2602_VOC: s.tgs2602Voc,
      Samples_Count: s.samplesCount
    }));
    
    exportToCSV(exportData, `respondent_${respondent.id}_data`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <Link href="/respondents" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4 font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Respondents
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              respondent.status === 'diabetes' 
                ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white' 
                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
            }`}>
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">{respondent.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="font-medium bg-muted px-2 py-0.5 rounded-md text-foreground">ID: #{respondent.id}</span>
                <span>{respondent.age} years old</span>
                <span className="capitalize">{respondent.gender}</span>
                <Badge variant="outline" className={`capitalize font-medium ${
                  respondent.status === 'diabetes' ? 'border-rose-200 text-rose-600' : 'border-emerald-200 text-emerald-600'
                }`}>
                  {respondent.status} Group
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!completedSessions.length} className="rounded-xl hover-elevate bg-card">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Link href="/sessions/new">
              <Button className="rounded-xl hover-elevate shadow-md shadow-primary/20">
                <Wind className="w-4 h-4 mr-2" /> New Sample
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left Column - Stats & Chart */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 rounded-2xl shadow-sm border border-border/50">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Beaker className="w-5 h-5 text-primary" /> Session Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Sessions</span>
                <span className="font-bold text-lg">{respondent.sessions.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-bold text-lg text-emerald-600">{completedSessions.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">First Added</span>
                <span className="font-medium">{format(new Date(respondent.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </Card>

          {latestSession && (
            <Card className="p-6 rounded-2xl shadow-sm border border-border/50">
              <h3 className="font-display font-bold text-lg mb-1">Latest Reading</h3>
              <p className="text-xs text-muted-foreground mb-6">From session #{latestSession.sessionNumber}</p>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {respondent.status === 'diabetes' && latestSession.mq138AcetonePpm && latestSession.mq138AcetonePpm > 0 && (
                <div className="mt-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-100 leading-relaxed dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-200">
                  <span className="font-semibold block mb-1">Biomarker Note:</span>
                  Elevated MQ-138 (Acetone) levels are often correlated with diabetic ketoacidosis or diabetes status.
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column - Session History */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b bg-muted/20">
              <h3 className="font-display font-bold text-lg">Session History</h3>
            </div>
            
            <div className="flex-1 overflow-auto bg-card p-0">
              {respondent.sessions.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Activity className="w-12 h-12 mb-4 text-muted-foreground/30" />
                  <p>No sampling sessions recorded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {respondent.sessions.sort((a,b) => b.id - a.id).map(session => (
                    <div key={session.id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm ${
                            session.state === 'completed' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'
                          }`}>
                            #{session.sessionNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium">{format(new Date(session.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{format(new Date(session.createdAt), 'HH:mm:ss')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`capitalize font-medium ${
                          session.state === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30' :
                          session.state === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30'
                        }`}>
                          {session.state}
                        </Badge>
                      </div>

                      {session.state === 'completed' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Alcohol (MQ3)</p>
                            <p className="font-mono text-lg font-bold text-foreground">{session.mq3AlcoholPpm?.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">PPM</p>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Methane (MQ4)</p>
                            <p className="font-mono text-lg font-bold text-foreground">{session.mq4MethanePpm?.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">PPM</p>
                          </div>
                          <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-8 h-8 bg-primary/10 rounded-bl-full"></div>
                            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Acetone (MQ138)</p>
                            <p className="font-mono text-lg font-bold text-primary">{session.mq138AcetonePpm?.toFixed(2)}</p>
                            <p className="text-[10px] text-primary/70">PPM</p>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">VOC (TGS2602)</p>
                            <p className="font-mono text-lg font-bold text-foreground">{session.tgs2602Voc?.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">Index</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
