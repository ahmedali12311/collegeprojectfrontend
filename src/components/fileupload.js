import React, { useRef } from "react";

const FileUpload = ({ file, onFileChange }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    onFileChange(e.target.files[0]);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click(); // Programmatically trigger the file input
  };

  return (
    <div className="file-upload" onClick={triggerFileInput}>
      <span>{file ? file.name : "Choose a file"}</span>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }} 
      />
    </div>
  );
};

export default FileUpload;