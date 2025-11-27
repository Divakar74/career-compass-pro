import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Target, TrendingUp, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">AI-Powered Career Guidance</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Discover Your Perfect Career Path
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Take our comprehensive AI-powered assessment to find careers that match your skills, interests, and goals. Get personalized recommendations in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/assessment")} className="text-lg px-8">
                Start Free Assessment
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose CareerPath AI?</h2>
          <p className="text-lg text-muted-foreground">
            Advanced AI technology meets career counseling expertise
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)] bg-[var(--gradient-card)]">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Personalized Matching</h3>
            <p className="text-muted-foreground">
              Our AI analyzes your unique profile to recommend careers that truly fit your strengths and aspirations.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)] bg-[var(--gradient-card)]">
            <div className="inline-flex p-4 rounded-full bg-secondary/10 mb-6">
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Growth Insights</h3>
            <p className="text-muted-foreground">
              Get detailed information about salary ranges, job outlook, and growth opportunities for each career.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)] bg-[var(--gradient-card)]">
            <div className="inline-flex p-4 rounded-full bg-accent/10 mb-6">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Expert-Backed</h3>
            <p className="text-muted-foreground">
              Assessment developed with career counseling professionals and backed by labor market data.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-[var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-card)]">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Path?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of professionals who have discovered their ideal career with CareerPath AI
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/assessment")}
            className="bg-background text-foreground hover:bg-background/90 text-lg px-8"
          >
            Get Started Now
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 CareerPath AI. Powered by advanced AI technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
