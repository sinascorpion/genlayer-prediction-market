"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Link as LinkIcon, HelpCircle } from "lucide-react";
import { useCreateMarket } from "@/lib/hooks/usePredictionMarket";
import type { FeePresetLevel } from "@/lib/genlayer/fees";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CreateMarketModal() {
  const { isConnected, address, isLoading } = useWallet();
  const { createMarket, isCreating, isSuccess } = useCreateMarket();

  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [resolutionUrl, setResolutionUrl] = useState("");
  const [feePresetLevel, setFeePresetLevel] = useState<FeePresetLevel>("standard");

  const [errors, setErrors] = useState({
    question: "",
    resolutionUrl: "",
  });

  useEffect(() => {
    if (!isConnected && isOpen && !isCreating) {
      setIsOpen(false);
    }
  }, [isConnected, isOpen, isCreating]);

  const validateForm = (): boolean => {
    const newErrors = {
      question: "",
      resolutionUrl: "",
    };

    if (!question.trim()) {
      newErrors.question = "Question is required";
    }

    if (!resolutionUrl.trim() || !resolutionUrl.startsWith("http")) {
      newErrors.resolutionUrl = "Valid URL (http/https) is required";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    createMarket({
      question,
      resolutionUrl,
      feePresetLevel,
    });
  };

  const resetForm = () => {
    setQuestion("");
    setResolutionUrl("");
    setErrors({ question: "", resolutionUrl: "" });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) {
      resetForm();
    }
    setIsOpen(open);
  };

  useEffect(() => {
    if (isSuccess) {
      resetForm();
      setIsOpen(false);
    }
  }, [isSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" disabled={!isConnected || !address || isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Create Market
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Prediction Market</DialogTitle>
          <DialogDescription>
            Pose a question and provide a URL where GenLayer AI can find the truth.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="question" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 !text-white" />
              Question
            </Label>
            <Input
              id="question"
              type="text"
              placeholder="e.g. Will SpaceX launch Starship today?"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setErrors({ ...errors, question: "" });
              }}
              className={errors.question ? "border-destructive" : ""}
            />
            {errors.question && (
              <p className="text-xs text-destructive">{errors.question}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolutionUrl" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 !text-white" />
              Resolution URL
            </Label>
            <Input
              id="resolutionUrl"
              type="url"
              placeholder="https://news.ycombinator.com"
              value={resolutionUrl}
              onChange={(e) => {
                setResolutionUrl(e.target.value);
                setErrors({ ...errors, resolutionUrl: "" });
              }}
              className={errors.resolutionUrl ? "border-destructive" : ""}
            />
            {errors.resolutionUrl && (
              <p className="text-xs text-destructive">{errors.resolutionUrl}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Fee Preset</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "low", label: "Low", detail: "No appeals" },
                { value: "standard", label: "Standard", detail: "1 appeal" },
                { value: "high", label: "High", detail: "2 appeals" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFeePresetLevel(option.value)}
                  className={`rounded-md border px-3 py-2 text-left transition-all ${
                    feePresetLevel === option.value
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="text-sm font-semibold">{option.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{option.detail}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Market"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
