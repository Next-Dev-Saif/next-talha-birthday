import { Col, Container, Row } from "reactstrap";
import imag2 from "../../public/img2.png";
import Image from "next/image";


const HBD = () => {
  return (
<div className="py-5">
<Container >
      <Row className="g-2">
      <Col md={6} className="d-flex align-items-center">
            <div>
            <h3 className="title mb-1">from Saif !</h3>
            <h4 className="subtitle  mb-0">May this day bring all the happiness in your life ! </h4>
            </div>
        </Col>
        <Col md={6}>
          <div >
            <Image
              style={{ animation: "up-down 2s alternate infinite" }}
              height={400}
              className="full-width object-fit-contain"
              src={imag2}
              alt="img-2"
            />
          </div>
        </Col>
      
      </Row>
    </Container>
</div>
  );
};
export default HBD;
