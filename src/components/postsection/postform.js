import React, { useState, useEffect } from "react";
import FileUpload from '.././fileupload'; // Import the FileUpload component
import { jwtDecode } from "jwt-decode"; // Corrected import for jwt-decode

function PostForm({ onPostCreated, fetchPosts }) {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // State for error messages

  const checkUserRole = () => {
    const token = localStorage.getItem("token");
  
    if (token) {
      try {
        const decode = jwtDecode(token);
  
        // Ensure decode and user_role exist and are valid
        const userRoles = decode?.user_role 
          ? (Array.isArray(decode.user_role) 
              ? decode.user_role 
              : [decode.user_role]) // Ensure it's always an array
          : [];
  
        setIsAdmin(userRoles.some(role => role === "admin")); // Check if "admin" role exists
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsAdmin(false); // Default to false if token is invalid
      }
    } else {
      console.warn("No token found in local storage.");
      setIsAdmin(false); // Default to false if no token exists
    }
  };
  useEffect(() => {
    checkUserRole(); // Check user role on component mount
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(""); // Reset error message before submission

    // Create FormData to send file and description
    const formData = new FormData();
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await fetch("http://localhost:8080/post", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.message || "Failed to create post"); 
      }

      const newPost = await response.json();
      onPostCreated(newPost); 

      setDescription("");
      setFile(null);
    } catch (error) {
      setErrorMessage(error.message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return null; 
  }

  return (
    <div className="post-form">
      <h2>انشاء منشور</h2>
      {errorMessage && <div className="error-message">{errorMessage}</div>} {/* Display error message */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's on your mind?"
          rows="5"
          required
        ></textarea>

        <FileUpload file={file} onFileChange={setFile} /> 

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}

export default PostForm;