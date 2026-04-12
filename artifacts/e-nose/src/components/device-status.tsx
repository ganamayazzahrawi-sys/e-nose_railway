import { useGetDeviceStatus } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DeviceStatusBadge() {
  const { data: status, isLoading } = useGetDeviceStatus({
    query: { refetchInterval: 2000 } // Poll every 2s
  });

  if (isLoading || !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-muted text-muted-foreground text-sm font-medium animate-pulse">
        <Activity className="w-4 h-4" />
        <span>Checking Device...</span>
      </div>
    );
  }

  const isOnline = status.isOnline;
  
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium shadow-sm transition-colors ${
        isOnline 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400' 
          : 'bg-destructive/10 border-destructive/20 text-destructive dark:bg-destructive/20'
      }`}>
        {isOnline ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5" />
            <span>Pico 2W Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Device Offline</span>
          </>
        )}
      </div>

      {isOnline && (
        <Badge variant="outline" className="capitalize px-3 py-1 shadow-sm font-display text-xs">
          State: {status.state}
        </Badge>
      )}

      {status.lastSeen && !isOnline && (
        <span className="text-xs text-muted-foreground">
          Last seen {formatDistanceToNow(new Date(status.lastSeen), { addSuffix: true })}
        </span>
      )}
    </div>
  );
}
