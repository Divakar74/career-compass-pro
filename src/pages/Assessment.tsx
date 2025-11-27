import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  category: string;
  question_order: number;
}

const Assessment = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadQuestions();
  }, []);

  const checkAuthAndLoadQuestions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to take the assessment");
      navigate("/auth");
      return;
    }

    // Create new assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({ user_id: session.user.id })
      .select()
      .single();

    if (assessmentError) {
      toast.error("Failed to start assessment");
      return;
    }

    setAssessmentId(assessment.id);

    // Load questions
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .order("question_order");

    if (questionsError) {
      toast.error("Failed to load questions");
    } else {
      setQuestions(questionsData || []);
    }

    setLoading(false);
  };

  const handleNext = () => {
    if (!answers[questions[currentQuestion].id]) {
      toast.error("Please answer the question before continuing");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!answers[questions[currentQuestion].id]) {
      toast.error("Please answer the question before submitting");
      return;
    }

    setSubmitting(true);

    try {
      // Save all answers
      const answerRecords = Object.entries(answers).map(([questionId, answerText]) => ({
        assessment_id: assessmentId,
        question_id: questionId,
        answer_text: answerText,
      }));

      const { error: answersError } = await supabase
        .from("assessment_answers")
        .insert(answerRecords);

      if (answersError) throw answersError;

      // Call edge function to match careers
      const { data, error } = await supabase.functions.invoke("match-careers", {
        body: {
          assessmentId,
          answers: Object.entries(answers).map(([questionId, answerText]) => ({
            questionId,
            answerText,
          })),
        },
      });

      if (error) throw error;

      toast.success("Assessment completed! Redirecting to results...");
      navigate(`/results/${assessmentId}`);
    } catch (error: any) {
      console.error("Error submitting assessment:", error);
      toast.error(error.message || "Failed to complete assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="max-w-3xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Career Assessment</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <Progress value={progress} className="mt-4" />
        </div>

        <Card className="p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
              {questions[currentQuestion]?.category}
            </p>
            <h2 className="text-2xl font-semibold mb-4">
              {questions[currentQuestion]?.question_text}
            </h2>
          </div>

          <Textarea
            value={answers[questions[currentQuestion]?.id] || ""}
            onChange={(e) =>
              setAnswers({
                ...answers,
                [questions[currentQuestion].id]: e.target.value,
              })
            }
            placeholder="Type your answer here..."
            className="min-h-[150px] text-base"
          />

          <div className="flex justify-between mt-8">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentQuestion < questions.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Complete Assessment"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Assessment;