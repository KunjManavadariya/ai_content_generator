import "./StepProgress.css";
import { useEffect, useState } from "react";

interface Props {
  progressText: string | null;
  isVisible: boolean;
}

const STEP_LABELS = [
  "Fetching account data",
  "Validating competitor Ids",
  "Fetching posts from social media",
  "Calculating top posts",
  "Generating text description of the images",
  "Analysing and generating fresh content",
  "Generating and uploading images for new content",
  "Done ✅",
];

export const StepProgress = ({ progressText, isVisible }: Props) => {
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (!progressText) return;
    const matchedIndex = STEP_LABELS.findIndex((label) =>
      progressText.includes(label)
    );

    if (matchedIndex > currentStep) {
      setCurrentStep(matchedIndex);
    }
  }, [currentStep, progressText]);

  if (!isVisible) return null;

  return (
    <div className="step-progress">
      <h4>Progress</h4>
      <ul className="step-list">
        {STEP_LABELS.map((label, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep;

          return (
            <li key={label} className={`step-item ${isActive ? "active" : ""}`}>
              <div className="step-icon">
                {isDone ? (
                  <span className="checkmark">✓</span>
                ) : isActive ? (
                  <div className="spinner" />
                ) : (
                  <div className="circle" />
                )}
              </div>
              <span className="step-label">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
