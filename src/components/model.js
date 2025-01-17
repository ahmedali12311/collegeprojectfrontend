import React, { useEffect, useRef } from 'react';
import '../style/model.css';

const Modal = ({ isOpen, onClose, mediaSrc }) => {
  const videoRef = useRef(null);
  const modalRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
  
    // Enable scrolling on the modal content
    const enableModalScroll = (e) => {
      e.stopPropagation();
    };
  
    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
  
    // Handle click outside
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
  
    // Handle touch events
    const handleTouchMove = (e) => {
      if (modalRef.current?.contains(e.target)) {
        e.stopPropagation();
        return;
      }
      e.preventDefault();
    };
  
    // Capture the current modal reference
    const currentModalRef = modalRef.current;
  
    // Add event listeners
    currentModalRef?.addEventListener('scroll', enableModalScroll);
    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
  
    // Cleanup
    return () => {
      currentModalRef?.removeEventListener('scroll', enableModalScroll);
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
  const videoExtensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.m4v'];

  const isImage = imageExtensions.some(ext => mediaSrc.toLowerCase().endsWith(ext));
  const isVideo = videoExtensions.some(ext => mediaSrc.toLowerCase().endsWith(ext));

  return (
    <div className="modal-backdrop">
      <button 
        className="modal-close" 
        onClick={onClose} 
        aria-label="Close modal"
      >
        ×
      </button>
      <div className="modal-container" ref={modalRef}>
        <div className="modal-content">
          {isVideo ? (
            <video 
              ref={videoRef}
              src={mediaSrc} 
              controls 
              className="modal-video"
              playsInline
              controlsList="nodownload"
              preload="metadata"
              onClick={(e) => e.stopPropagation()}
            />
          ) : isImage ? (
            <img 
              src={mediaSrc} 
              alt="Modal Content" 
              className="modal-image"
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <a 
              href={mediaSrc} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="modal-file-link"
              onClick={(e) => e.stopPropagation()}
            >
              View File
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;