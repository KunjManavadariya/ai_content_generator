/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { StepProgress } from "./components/StepProgress";
import { useWebSocketProgress } from "./hooks/useWebSocketProgress";
import { omitKeys } from "./utils";

const apiUrl = import.meta.env.VITE_API_URL;

export type RequestData = {
  startDate: string;
  endDate: string;
  userIds: string;
  competitorIds: string;
  limit: number;
  topHowManyPosts: number;
  generateHowManyPosts: number;
  aiModelPlatform: string;
  aiPrompt: string;
  imageToTextModel: string;
  textToTextModel: string;
  textToImageModel: string;
  socialMediaPlatform: string;
};
function App() {
  const [formData, setFormData] = useState<RequestData>({
    startDate: "2025-03-01",
    endDate: "2025-04-01",
    userIds: "socialpilot_co",
    competitorIds: "hootsuite",
    limit: 50,
    topHowManyPosts: 10,
    generateHowManyPosts: 3,
    aiModelPlatform: "bedrock",
    aiPrompt: `You are an expert social media content creator. I will provide you past data of my page's top highest-performing posts from Instagram, along with top-performing posts from various competitors. Your task is to analyze them and generate 3 new high-performing posts based on the themes, tone, and engagement patterns that have worked best in terms of engagement, likes, comments, shares, etc from my posts and my competitors posts.

Instructions:
• Only provide the posts (text post or single image post) in a directly usable format.
• If a post includes image, describe it in full detail.
• For image, specify composition, colors, lighting, subject placement, background details, and any emotions conveyed.
• Each post must be self-contained, with detailed captions and high performing hashtags ready for posting.
• Each post should contain a context on why this content was created, how this post aligns with identified trends, and the expected impact.`,
    imageToTextModel: "amazon.nova-pro-v1:0",
    textToTextModel: "anthropic.claude-3-haiku-20240307-v1:0",
    textToImageModel: "stability.stable-diffusion-xl-v1",
    socialMediaPlatform: "25",
  });
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [processedContent, setProcessedContent] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessedContentVisible, setIsProcessedContentVisible] =
    useState<boolean>(false);
  const [isRawDataVisible, setIsRawDataVisible] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isModelDisabled, setIsModelDisabled] = useState<boolean>(false);
  const { progressMessage, setProgressMessage } = useWebSocketProgress(jobId);

  const toggleProcessedContent = () => {
    setIsProcessedContentVisible(!isProcessedContentVisible);
  };

  const toggleRawData = () => {
    setIsRawDataVisible(!isRawDataVisible);
  };

  // Process and extract content from the API response
  useEffect(() => {
    if (!rawResponse) return;

    try {
      // Extracting the processed content based on rawResponse format
      let extractedContent: string[] = [];
      if (Array.isArray(rawResponse.response.data)) {
        extractedContent = rawResponse.response.data.map((item: any) =>
          typeof item === "string" ? item : JSON.stringify(item, null, 2)
        );
      }
      setProcessedContent(extractedContent);

      // Extracting raw data
      const raw = rawResponse.response.rawData;
      if (raw) {
        setRawData(Object.keys(raw).map((key) => raw[key]));
      }
    } catch (err) {
      console.error("Error processing response:", err);
      setError("Error processing API response. See console for details.");
      setProcessedContent([JSON.stringify(rawResponse, null, 2)]);
    }
  }, [rawResponse]);

  // Handle form data changes
  const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      aiPrompt: e.target.value,
    });
  };
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValue = parseInt(value, 10);
    const validValue = !isNaN(newValue) && value !== "";

    setFormData((prevData) => {
      const updatedPrompt = validValue
        ? prevData.aiPrompt.replace(
            /(\d+) new high-performing posts/,
            `${newValue} new high-performing posts`
          )
        : prevData.aiPrompt.replace(
            /(\d+) new high-performing posts/,
            "0 new high-performing posts"
          );

      return {
        ...prevData,
        [name]: validValue ? newValue : "",
        aiPrompt: updatedPrompt,
      };
    });
  };
  const handleUserIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      userIds: value,
    }));
  };
  const handleCompetitorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      competitorIds: value,
    }));
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "socialMediaPlatform") {
      let updatedPrompt = formData.aiPrompt;
      let updatedUserId = formData.userIds;
      let updatedCompetitorId = formData.competitorIds;
      if (value === "5") {
        updatedPrompt = updatedPrompt.replace(/Instagram/g, "Facebook");
        updatedUserId = "226278177573344";
        updatedCompetitorId = "177463958820";
      } else if (value === "25") {
        updatedPrompt = updatedPrompt.replace(/Facebook/g, "Instagram");
        updatedUserId = "socialpilot_co";
        updatedCompetitorId = "hootsuite";
      }
      setFormData({
        ...formData,
        socialMediaPlatform: value,
        aiPrompt: updatedPrompt,
        userIds: updatedUserId,
        competitorIds: updatedCompetitorId,
      });
      return;
    }
    if (name === "aiModelPlatform" && value === "openai") {
      setIsModelDisabled(true);
      setFormData((prevData) => ({
        ...prevData,
        aiModelPlatform: value,
        imageToTextModel: "gpt-4o",
        textToTextModel: "gpt-4o",
        textToImageModel: "gpt-4o",
      }));
      return;
    } else {
      setIsModelDisabled(false);
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const generatedJobId = Date.now().toString();
    setJobId(generatedJobId);

    setLoading(true);
    setError(null);
    setRawResponse(null);
    setProcessedContent([]);
    setRawData([]);
    setProgressMessage(null);

    const modelsToUse = [
      formData.imageToTextModel,
      formData.textToTextModel,
      formData.textToImageModel,
    ];

    const data = omitKeys(formData, [
      "imageToTextModel",
      "textToTextModel",
      "textToImageModel",
    ]);

    try {
      const data1 = {
        ...data,
        jobId: generatedJobId,
        userIds:
          formData.socialMediaPlatform === "5"
            ? formData.userIds.split(",").map((id) => Number(id.trim()))
            : formData.userIds.split(",").map((id) => id.trim()),
        competitorIds:
          formData.socialMediaPlatform === "5"
            ? formData.competitorIds.split(",").map((id) => Number(id.trim()))
            : formData.competitorIds.split(",").map((id) => id.trim()),
        modelsToUse,
      };
      const response = await axios.post(apiUrl, data1, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setRawResponse(response.data);
    } catch (err) {
      console.error("API Error:", err);
      setError(
        err
          ? (err as any)?.response?.data?.message || "An unknown error occurred"
          : "An error occurred while generating content"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        alert("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <div className="app-container">
      <div className="live-banner">
        <span className="banner-text">
          This site is under beta phase. We only support image and text posts to
          be generated. Please contact POD Parth if you encounter serious issues
          for more than 3 times.
        </span>
      </div>
      <header>
        <h1>AI Content Generator</h1>
        <h3>Generate content based on competitor analysis</h3>
      </header>
      <main>
        <div className="form-with-progress">
          <div className="form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleDateChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleDateChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="socialMediaPlatform">
                    Social Media Platform
                  </label>
                  <select
                    id="socialMediaPlatform"
                    name="socialMediaPlatform"
                    value={formData.socialMediaPlatform}
                    onChange={handleSelectChange}
                    required
                  >
                    <option value="5">Facebook</option>
                    <option value="25">Instagram</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="userIds">User IDs (comma-separated)</label>
                  <input
                    type="text"
                    id="userIds"
                    value={formData.userIds}
                    onChange={handleUserIdChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="competitorIds">
                    Competitor IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="competitorIds"
                    value={formData.competitorIds}
                    onChange={handleCompetitorChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="limit">Limit</label>
                  <input
                    type="number"
                    id="limit"
                    name="limit"
                    value={formData.limit}
                    onChange={handleNumberChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="topHowManyPosts">Top Posts to Analyze</label>
                  <input
                    type="number"
                    id="topHowManyPosts"
                    name="topHowManyPosts"
                    value={formData.topHowManyPosts}
                    onChange={handleNumberChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="generateHowManyPosts">
                    Posts to Generate
                  </label>
                  <input
                    type="number"
                    id="generateHowManyPosts"
                    name="generateHowManyPosts"
                    value={formData.generateHowManyPosts}
                    onChange={handleNumberChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="aiModelPlatform">Select AI Platform</label>
                  <select
                    id="aiModelPlatform"
                    name="aiModelPlatform"
                    value={formData.aiModelPlatform}
                    onChange={handleSelectChange}
                    required
                  >
                    <option value="bedrock">AWS Bedrock</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="imageToTextModel">Image to Text Model</label>
                  <select
                    id="imageToTextModel"
                    name="imageToTextModel"
                    value={formData.imageToTextModel}
                    onChange={handleSelectChange}
                    disabled={isModelDisabled}
                    required={!isModelDisabled}
                  >
                    <option value="amazon.nova-pro-v1:0">AWS Nova Pro</option>
                    <option value="anthropic.claude-3-5-sonnet-20240620-v1:0">
                      Claude 3.5 Sonnet V1
                    </option>
                    <option value="anthropic.claude-3-haiku-20240307-v1:0">
                      Claude 3 Haiku
                    </option>
                    <option value="anthropic.claude-3-sonnet-20240229-v1:0">
                      Claude 3 Sonnet V1
                    </option>
                    {isModelDisabled && (
                      <option value="gpt-4o">OpenAI GPT-4o</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="textToTextModel">Text to Text Model</label>
                  <select
                    id="textToTextModel"
                    name="textToTextModel"
                    value={formData.textToTextModel}
                    onChange={handleSelectChange}
                    disabled={isModelDisabled}
                    required={!isModelDisabled}
                  >
                    <option value="amazon.nova-pro-v1:0">AWS Nova Pro</option>
                    <option value="anthropic.claude-3-5-sonnet-20240620-v1:0">
                      Claude 3.5 Sonnet V1
                    </option>
                    <option value="anthropic.claude-3-haiku-20240307-v1:0">
                      Claude 3 Haiku
                    </option>
                    <option value="anthropic.claude-3-sonnet-20240229-v1:0">
                      Claude 3 Sonnet V1
                    </option>
                    {isModelDisabled && (
                      <option value="gpt-4o">OpenAI GPT-4o</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="textToImageModel">Text to Image Model</label>
                  <select
                    id="textToImageModel"
                    name="textToImageModel"
                    value={formData.textToImageModel}
                    onChange={handleSelectChange}
                    disabled={isModelDisabled}
                    required={!isModelDisabled}
                  >
                    <option value="stability.stable-diffusion-xl-v1">
                      Stability Diffusion SDXL 1.0
                    </option>
                    <option value="amazon.titan-image-generator-v2:0">
                      AWS Titan Image Generator G1 v2
                    </option>
                    {isModelDisabled && (
                      <option value="gpt-4o">OpenAI GPT-4o</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="aiPrompt">
                    AI Model Prompt (Keep empty for the system generated prompt
                    automatically)
                  </label>
                  <textarea
                    id="aiPrompt"
                    name="aiPrompt"
                    value={formData.aiPrompt}
                    onChange={handlePromptChange}
                    rows={10}
                    placeholder="Enter your AI prompt here"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Content 🚀"}
              </button>
            </form>
          </div>
          {loading && (
            <div className="progress-area">
              <StepProgress
                progressText={progressMessage}
                isVisible={loading}
              />
            </div>
          )}
        </div>
        <div className="response-section">
          {error && <div className="error-message">Error: {error}</div>}

          {/* Raw Data Toggle */}
          {rawData.length > 0 && (
            <>
              <div className="toggle-arrow" onClick={toggleRawData}>
                <span className="toggle-text">Raw Data</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`arrow-icon ${isRawDataVisible ? "rotated" : ""}`}
                >
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </div>
              <div
                className={`processed-content-container ${
                  isRawDataVisible ? "open" : "closed"
                }`}
              >
                <div className="result-section">
                  {rawData.map((rawItem, index) => (
                    <div key={index} className="generated-content-item">
                      <div className="generated-content-item-header">
                        <h3>Raw Post Data {index + 1}</h3>
                        {index === 0 && (
                          <button
                            className="copy-button"
                            onClick={() =>
                              copyToClipboard(JSON.stringify(rawData, null, 2))
                            }
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <pre>{JSON.stringify(rawItem, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Processed Content Toggle */}
          {processedContent.length > 0 && (
            <>
              <div className="toggle-arrow" onClick={toggleProcessedContent}>
                <span className="toggle-text">Processed Response</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`arrow-icon ${
                    isProcessedContentVisible ? "rotated" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </div>
              <div
                className={`processed-content-container ${
                  isProcessedContentVisible ? "open" : "closed"
                }`}
              >
                <div className="result-section">
                  {processedContent.map((post, index) => (
                    <div key={index} className="generated-content-item">
                      <h3>Post {index + 1}</h3>
                      <pre>{post}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {rawResponse?.response?.data ? (
            <div className="posts-feed">
              {rawResponse.response.data.map((post: any, index: number) => {
                // Check the type of competitor ID and decide which card to display
                const socialMediaType =
                  rawResponse.response.accountId === 5
                    ? "facebook"
                    : "instagram";

                if (socialMediaType === "instagram") {
                  // Display Instagram card for string IDs
                  return (
                    <div key={index} className="insta-post-card">
                      {/* Instagram Card UI */}
                      <div className="post-header">
                        <img
                          src="https://images.unsplash.com/photo-1634942537034-2531766767d1?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="avatar"
                          className="avatar"
                        />
                        <span className="username">your_username</span>
                        <span className="timestamp">• 1h</span>
                      </div>
                      {post.image && (
                        <img
                          src={post.image}
                          alt="Post"
                          className="post-image"
                        />
                      )}
                      <div className="post-caption">
                        <strong>your_username</strong> {post.caption}
                      </div>
                      <div className="post-actions">
                        <span>
                          <svg viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </span>
                        <span>
                          <svg viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </span>
                        <span>
                          <svg viewBox="0 0 24 24">
                            <path d="M4 4v16l6-6h10V4z"></path>
                          </svg>
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  // Display Facebook card for number IDs
                  return (
                    <div key={index} className="facebook-post-card">
                      {/* Facebook Card UI */}
                      <div className="post-header">
                        <img
                          src="https://cdn-icons-png.freepik.com/256/2504/2504903.png?semt=ais_hybrid"
                          alt="avatar"
                          className="avatar"
                        />
                        <span className="username">your_username</span>
                        <span className="timestamp">• 1h</span>
                      </div>
                      {post.image && (
                        <img
                          src={post.image}
                          alt="Post"
                          className="post-image"
                        />
                      )}
                      <div className="post-caption">
                        <strong>your_username</strong> {post.caption}
                      </div>
                      <div className="post-actions">
                        <span>
                          <svg viewBox="0 0 24 24">
                            <path
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 
        4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 
        2.09C13.09 3.81 14.76 3 16.5 
        3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
        6.86-8.55 11.54L12 21.35z"
                            ></path>
                          </svg>
                          Like
                        </span>
                        <span>
                          <svg viewBox="0 0 24 24">
                            <path
                              d="M21 15a2 2 0 0 1-2 2H7l-4 
        4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 
        2z"
                            ></path>
                          </svg>
                          Comment
                        </span>
                        <span>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M22 2L11 13"></path>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                          </svg>
                          Share
                        </span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            <div className="empty-placeholder"></div>
          )}
        </div>
      </main>
    </div>
  );
}
export default App;
