"use client";
import { Container, Row, Col } from "reactstrap";
import Image from "next/image";
import { useState } from "react";

const PhotoGallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const photos = [
    { src: "/talha-photos/photo-1.jpg", alt: "Talha Photo 1" },
    { src: "/talha-photos/photo-2.jpg", alt: "Talha Photo 2" },
    { src: "/talha-photos/photo-3.jpg", alt: "Talha Photo 3" },
    { src: "/talha-photos/photo-4.jpg", alt: "Talha Photo 4" },
  ];

  const openModal = (photo) => {
    setSelectedImage(photo);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="photo-gallery-section">
      <Container>
        <div className="gallery-header">
          <h2 className="gallery-title">Meet Talha</h2>
          <p className="gallery-subtitle">Meet the birthday boy</p>
        </div>
        
        <div className="stylish-gallery">
          <div className="gallery-container">
            {photos.map((photo, index) => (
              <div 
                key={index}
                className={`gallery-item item-${index + 1}`}
                onClick={() => openModal(photo)}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="image-wrapper">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={400}
                    height={500}
                    className="gallery-image"
                  />
                  <div className="image-overlay">
                    <div className="overlay-content">
                      <div className="zoom-icon">🔍</div>
                      <div className="photo-number">{index + 1}</div>
                    </div>
                  </div>
                </div>
                <div className="photo-frame"></div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              width={800}
              height={600}
              className="modal-image"
            />
          </div>
        </div>
      )}

      <style jsx>{`
       
      `}</style>
    </div>
  );
};

export default PhotoGallery;
