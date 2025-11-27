import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, TrendingUp, DollarSign, GraduationCap, Briefcase, Home } from "lucide-react";

interface CareerMatch {
  id: string;
  match_score: number;
  reasoning: string;
  careers: {
    id: string;
    title: string;
    description: string;
    required_skills: string[];
    education_level: string;
    average_salary: string;
    growth_outlook: string;
    work_environment: string;
  };
}

const Results = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [assessmentId]);

  const loadResults = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to view results");
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("career_matches")
      .select(`
        *,
        careers (*)
      `)
      .eq("assessment_id", assessmentId)
      .order("match_score", { ascending: false });

    if (error) {
      toast.error("Failed to load results");
    } else {
      setMatches(data || []);
    }

    setLoading(false);
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Your Career Matches</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Based on your assessment, here are careers that align with your profile
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/dashboard")}>
              View Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/assessment")}>
              Take Another Assessment
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {matches.map((match, index) => (
            <Card
              key={match.id}
              className="p-6 hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      #{index + 1}
                    </Badge>
                    <h2 className="text-2xl font-bold">{match.careers.title}</h2>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-semibold">Match Score:</span>
                      <span className="text-primary font-bold text-lg">
                        {match.match_score}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">{match.careers.description}</p>

              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide">
                  Why this matches you:
                </h3>
                <p className="text-sm">{match.reasoning}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Average Salary</p>
                    <p className="text-sm text-muted-foreground">{match.careers.average_salary}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Growth Outlook</p>
                    <p className="text-sm text-muted-foreground">{match.careers.growth_outlook}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Education Level</p>
                    <p className="text-sm text-muted-foreground">{match.careers.education_level}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Work Environment</p>
                    <p className="text-sm text-muted-foreground">{match.careers.work_environment}</p>
                  </div>
                </div>
              </div>

              {match.careers.required_skills && match.careers.required_skills.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-sm mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {match.careers.required_skills.map((skill, i) => (
                      <Badge key={i} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button onClick={() => navigate("/")} variant="outline" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;