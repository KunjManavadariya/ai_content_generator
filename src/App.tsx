/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { StepProgress } from "./components/StepProgress";
import { useWebSocketProgress } from "./hooks/useWebSocketProgress";

const apiUrl = import.meta.env.VITE_API_URL;

interface RequestData {
  startDate: string;
  endDate: string;
  userLoginIds: string;
  competitorIds: string;
  limit: number;
  topHowManyPosts: number;
  generateHowManyPosts: number;
  aiModelPlatform: string;
}
function App() {
  const [formData, setFormData] = useState<RequestData>({
    startDate: "2025-02-17",
    endDate: "2025-03-17",
    userLoginIds: "1053933",
    competitorIds: "buffer",
    limit: 50,
    topHowManyPosts: 5,
    generateHowManyPosts: 3,
    aiModelPlatform: "bedrock",
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
  const { progressMessage } = useWebSocketProgress(jobId);

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
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value, 10),
    });
  };
  const handleUserIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      userLoginIds: value,
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
    try {
      const data1 = {
        ...formData,
        jobId: generatedJobId,
        userLoginIds: formData.userLoginIds
          .split(",")
          .map((id) => Number(id.trim())),
        competitorIds: formData.competitorIds.split(",").map((id) => id.trim()),
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
                  <label htmlFor="userLoginIds">
                    User Login IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="userLoginIds"
                    value={formData.userLoginIds}
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
                      <pre>{JSON.stringify(post, null, 2)}</pre>
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
