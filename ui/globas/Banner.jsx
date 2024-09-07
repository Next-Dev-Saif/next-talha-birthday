"use client";
import Image from "next/image";
import { Card, Col, Container, Row } from "reactstrap";
import bannerImg from "../../public/banner-img.png";
import baloonImG from "../../public/Baloon.png";
import { useEffect, useRef } from "react";

const Banner = () => {
  const bgAudio = useRef(new Audio(`/bg-music.mp3`));
  bgAudio.current.volume=0.3;

  const baloons = Array?.from({ length: 40 }, (_, index) => {
    return (
      <Image
        src={baloonImG}
        height={100}
        width={100}
        className="position-absolute object-fit-cover"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: 0,
          zIndex: 1,
          animation: `baloons-up 3s ${
            index * 0.1
          }s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite`,
        }}
      />
    );
  });

  useEffect(() => {
    document.addEventListener("mousemove", () => {
      if (bgAudio?.current) {
        bgAudio?.current?.play();
      }
    });
  }, []);

  return (
    <div className="page-section">
      {baloons}
      <Container fluid className="position-relative" style={{ zIndex: 3 }}>
        <Row className="justify-content-center" style={{ minHeight: "90vh" }}>
          <Col
            md={6}
            className="d-flex align-items-center  justify-content-center"
          >
            <div>
              <h1 className="banner-title text-center mb-5">Happy Birthday </h1>
              <h2 className="subtitle text-center m-0">
                Happy birthday to Talha Khan Niazi
              </h2>
              <Image
                src={bannerImg}
                height={600}
                className="full-width object-fit-contain"
                alt="banner-img"
              />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
export default Banner;
