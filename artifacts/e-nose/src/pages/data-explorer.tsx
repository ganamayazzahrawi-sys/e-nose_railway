import { useState } from "react";
import { useListSessions } from "@workspace/api-client-react";
import { Download, Database, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/export";
import { Link } from "wouter";

export default function DataExplorer() {
  const { data: sessions, isLoading } = useListSessions();
  const [searchTerm, setSearchTerm] = useState("");

  const completedSessions = sessions?.filter(s => s.state === 'completed') || [];
  
  const filteredSessions = completedSessions.filter(s => 
    s.respondent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toString().includes(searchTerm)
  ).sort((a,b) => b.id - a.id);

  const handleExport = () => {
    if (!filteredSessions.length) return;
    
    const exportData = filteredSessions.map(s => ({
      Session_ID: s.id,
      Respondent_ID: s.respondentId,
      Respondent_Name: s.respondent.name,
      Diabetes_Status: s.respondent.status,
      Date: format(new Date(s.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      MQ3_Alcohol_PPM: s.mq3AlcoholPpm,
      MQ4_Methane_PPM: s.mq4MethanePpm,
      MQ138_Acetone_PPM: s.mq138AcetonePpm,
      TGS2602_VOC: s.tgs2602Voc,
      Samples_Count: s.samplesCount
    }));
    
    exportToCSV(exportData, 'enose_full_dataset');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Data Explorer
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">View and export all completed sampling sessions.</p>
        </div>
        
        <Button onClick={handleExport} disabled={!filteredSessions.length} className="hover-elevate shadow-lg shadow-primary/20 rounded-xl px-6 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          <Download className="w-4 h-4 mr-2" />
          Export Dataset (CSV)
        </Button>
      </div>

      <Card className="rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-background border-border/50"
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
            {filteredSessions.length} records found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 uppercase border-b border-border/50 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID / Date</th>
                <th className="px-6 py-4">Respondent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">MQ3 (Alc)</th>
                <th className="px-6 py-4">MQ4 (Met)</th>
                <th className="px-6 py-4">MQ138 (Ace)</th>
                <th className="px-6 py-4">TGS (VOC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading dataset...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No completed sessions match your criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">#{session.id}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(session.createdAt), 'MMM d, yy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/respondents/${session.respondentId}`} className="font-medium text-primary hover:underline">
                        {session.respondent.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={`capitalize text-xs font-medium ${
                        session.respondent.status === 'diabetes' 
                          ? 'border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400' 
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                      }`}>
                        {session.respondent.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{session.mq3AlcoholPpm?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{session.mq4MethanePpm?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-primary">{session.mq138AcetonePpm?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{session.tgs2602Voc?.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Ensure Loader2 is imported above (missed in initial pass but used here)
import { Loader2 } from "lucide-react";
