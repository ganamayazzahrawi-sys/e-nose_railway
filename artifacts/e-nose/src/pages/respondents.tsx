import { useState } from "react";
import { useListRespondents, useCreateRespondent } from "@workspace/api-client-react";
import type { CreateRespondentInput } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Users, Plus, Search, ChevronRight, Activity, Beaker } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const respondentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(1, "Age is required"),
  gender: z.enum(["male", "female"]),
  status: z.enum(["diabetes", "non-diabetes"])
});

export default function Respondents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: respondents, isLoading } = useListRespondents();
  const { mutateAsync: createRespondent, isPending } = useCreateRespondent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateRespondentInput>({
    resolver: zodResolver(respondentSchema),
    defaultValues: {
      name: "",
      age: 30,
      gender: "male",
      status: "non-diabetes"
    }
  });

  const filteredRespondents = respondents?.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const onSubmit = async (data: CreateRespondentInput) => {
    try {
      await createRespondent({ data });
      queryClient.invalidateQueries({ queryKey: ["/api/respondents"] });
      toast({ title: "Respondent created successfully", variant: "default" });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Failed to create respondent", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Respondents</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage test subjects and their data.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate shadow-lg shadow-primary/20 rounded-xl px-6">
              <Plus className="w-4 h-4 mr-2" />
              Add Respondent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">New Respondent</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name or ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Patient A or John Doe" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <select 
                            {...field} 
                            className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Status</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="non-diabetes">Non-Diabetes (Control)</option>
                          <option value="diabetes">Diabetes Patient</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={isPending} className="w-full rounded-xl hover-elevate">
                    {isPending ? "Saving..." : "Save Respondent"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search respondents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-background border-border/50 focus-visible:ring-primary/20"
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4" />
            Total: {filteredRespondents.length}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            Loading respondents...
          </div>
        ) : filteredRespondents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">No respondents found</h3>
            <p className="text-muted-foreground mt-1 mb-4">Add a new respondent to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredRespondents.map((respondent) => (
              <Link key={respondent.id} href={`/respondents/${respondent.id}`}>
                <div className="p-4 md:p-6 hover:bg-muted/30 transition-colors flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      respondent.status === 'diabetes' 
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' 
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                    }`}>
                      {respondent.status === 'diabetes' ? <Activity className="w-6 h-6" /> : <Beaker className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {respondent.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <span>{respondent.age} yrs • {respondent.gender}</span>
                        <span>•</span>
                        <span>Added {format(new Date(respondent.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className={`capitalize font-medium px-3 py-1 ${
                      respondent.status === 'diabetes' 
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'
                    }`}>
                      {respondent.status}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
