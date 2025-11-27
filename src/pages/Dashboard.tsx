import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, LogOut, FileText, Calendar } from "lucide-react";

interface Assessment {
  id: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to view dashboard");
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || "");

    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load assessments");
    } else {
      setAssessments(data || []);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/")}>Home</Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <Button onClick={() => navigate("/assessment")} size="lg" className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Take New Assessment
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Assessments</h2>
          
          {assessments.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assessments yet</h3>
              <p className="text-muted-foreground mb-6">
                Take your first career assessment to discover your perfect career path
              </p>
              <Button onClick={() => navigate("/assessment")}>
                Get Started
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assessments.map((assessment) => (
                <Card
                  key={assessment.id}
                  className="p-6 hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {assessment.completed ? "Completed Assessment" : "In Progress"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {assessment.completed && (
                      <Button
                        onClick={() => navigate(`/results/${assessment.id}`)}
                        variant="outline"
                      >
                        View Results
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;