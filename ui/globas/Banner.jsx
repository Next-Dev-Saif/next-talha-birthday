"use client";
import Image from "next/image";
import { Button, Card, Col, Container, Row } from "reactstrap";
import bannerImg from "../../public/Banner.png";
import baloonImG from "../../public/Baloon.png";
import MusicWave from "../sections/Wave";
import Link from "next/link";

const Banner = () => {

 

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

 

  return (
    <div className="page-section banner">
      {baloons}
      <Container fluid className="position-relative" style={{ zIndex: 3 }}>
        <MusicWave style={{bottom:0,left:0,width:"100%",zIndex:1}} className="position-absolute d-md-block d-none"/>
        <MusicWave style={{top:0,left:0,width:"100%",zIndex:1}} className="position-absolute d-md-block d-none"/>
        <Row className="justify-content-center g-3 flex-row-reverse flex-md-row" style={{ minHeight: "90vh" }}>
          <Col
            md={6}
            className="d-flex align-items-center  justify-content-center"
          >
            <div>
              <h1 className="banner-title fw-bold text-center mb-0">Happy Birthday </h1>
              <h2 className="subtitle text-center mb-3"> Join virtual party</h2>
             <div className="text-center"> <Link className="cta-btn btn py-3 " href={"/party"}>Join Party</Link> </div>
              
             
              
            </div>
          </Col>
          <Col md={6} className="d-flex align-items-center justify-content-center">
          <Image
                src={bannerImg}
                height={600}
                width={300}
                style={{width:"100%",maxWidth:"400px",borderRadius:"1rem",zIndex:2}}
                className="full-width h-auto  object-fit-cover position-relative"
                alt="banner-img"
              />
          </Col>
        </Row>
      </Container>
    </div>
  );
};
export default Banner;
