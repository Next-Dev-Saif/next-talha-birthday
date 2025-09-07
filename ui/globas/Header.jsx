"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Collapse,
  Input,
  Nav,
  NavItem,
  NavLink,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Offcanvas,
  OffcanvasBody,
  Toast,
  ToastBody,
} from "reactstrap";

const Header = () => {
  const [expanded, setExpanded] = useState(false);
  const toggleNavbar = () => setExpanded((prev) => !prev);
  const [bg, setBG] = useState("transparent");
  const [toastShown, setToastShown] = useState(false);

  const [isSendingGreeting, setisSendingGreeting] = useState(false);
  const toggleSendingGreeting = () => setisSendingGreeting((prev) => !prev);

  useEffect(() => {
    const listener = () => {
      if (window.scrollY > 6) {
        setBG("rgba(255,255,255,0.8)");
      } else setBG("transparent");
    };
    document.addEventListener("scroll", listener);

    () => {
      document.removeEventListener("scroll", listener);
    };
  }, []);

  return (
    <>
      <Navbar
        className="header p-lg-4  p-3"
        expand="md"
        style={{ background: bg }}
      >
        <NavbarBrand href="/">Talha Birthday</NavbarBrand>
        <NavbarToggler onClick={() => toggleNavbar()} />

        <Nav navbar style={{ left: expanded ? `0` : `-100%` }}>
          <div
            className="full-width on-lg-hide justify-content-end"
            style={{ display: "flex" }}
          >
            <NavbarToggler onClick={() => toggleNavbar()} />{" "}
          </div>
          <NavItem>
            <NavLink role="button" onClick={() => toggleSendingGreeting()}>
              Send Greetings
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              role="button"
              onClick={() => {
               if(typeof navigator!=="undefined"){
                if (navigator?.clipboard) {
                  navigator.clipboard.writeText(`${window.location}`);
                  alert('Link copied')
                }
               }
              }}
            >
              Share Link
            </NavLink>
          </NavItem>
        </Nav>
      </Navbar>

      <Offcanvas isOpen={isSendingGreeting} toggle={toggleSendingGreeting}>
        <OffcanvasBody>
          <div className="d-flex justify-content-end mb-5">
            <button className="bg-transparent" onClick={toggleSendingGreeting}>
              X
            </button>
          </div>
          <h1 className="mb-4">So kind of you !</h1>
          <p>Please write your greeting below</p>

          <Input type="text" placeholder="Your name" className="mt-4" />
          <Input
            className="my-3"
            style={{ height: "300px" }}
            type="textarea"
            placeholder="Write your greeting here"
          />
          <Button
            onClick={() => setToastShown(true)}
            style={{ background: "rgb(47,30,69)" }}
            className=" full-width py-3"
          >
            Send
          </Button>
          {toastShown && (
            <Toast className="bg-success mt-3 text-white">
              <ToastBody>Thank you ! we have recieved your response</ToastBody>
            </Toast>
          )}
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
};

export default Header;
