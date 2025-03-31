import "./LiveProgressButton.css";

interface Props {
  isLoading: boolean;
  progressText: string | null;
}

const progressStages = [
  "Fetching account data...",
  "Validating competitor Ids...",
  "Fetching posts from social media...",
  "Calculating top posts...",
  "Generating text description of the images...",
  "Analysing and generating fresh content...",
  "Generating and uploading images for new content...",
  "Done ✅",
];

const normalizeProgress = (text: string | null): number => {
  if (!text) return 0;
  const index = progressStages.findIndex((stage) => text.includes(stage));
  if (index === -1) return 10;
  const percent = ((index + 1) / progressStages.length) * 100;
  return Math.min(percent, 100);
};

export const LiveProgressButton = ({ isLoading, progressText }: Props) => {
  const percent = normalizeProgress(progressText);

  if (!isLoading) {
    return <button type="submit">Generate Content</button>;
  }

  return (
    <div className="progress-button-container">
      <div className="progress-button-fill" style={{ width: `${percent}%` }} />
      <span className="progress-button-text">
        {progressText || "Working..."}
      </span>
    </div>
  );
};
